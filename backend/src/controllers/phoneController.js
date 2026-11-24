const crypto = require('crypto');
const phoneService = require('../services/phoneService');
const pool = require('../config/db');
const listCache = require('../utils/listCache');
const photoLruCache = require('../utils/photoLruCache');

class PhoneController {
    /**
     * GET /api/phones/:id/photo?c=<int>&i=<int>&v=<int>
     * Public phone photo endpoint (serves decoded binary images with long-term caching & ETag)
     */
    async getPhonePhoto(req, res, next) {
        try {
            const { id } = req.params;
            const phoneId = parseInt(id, 10);
            if (isNaN(phoneId) || phoneId <= 0) {
                return res.status(404).json({ success: false, message: 'Invalid phone ID' });
            }

            const c = parseInt(req.query.c, 10);
            const i = parseInt(req.query.i, 10);
            if (isNaN(c) || isNaN(i) || i < 0) {
                return res.status(400).json({ success: false, message: 'Invalid photo indices' });
            }

            const v = req.query.v ? String(req.query.v) : '';
            const cacheKey = `${phoneId}:${c}:${i}:${v}`;

            // 1. Check decoded buffer LRU cache
            const cachedPhoto = photoLruCache.getPhoto(cacheKey);
            if (cachedPhoto) {
                const clientEtag = req.headers['if-none-match'];
                if (clientEtag && (clientEtag === cachedPhoto.etag || clientEtag === `"${cachedPhoto.etag}"`)) {
                    return res.status(304).end();
                }

                res.setHeader('Content-Type', cachedPhoto.contentType);
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                res.setHeader('ETag', `"${cachedPhoto.etag}"`);
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                return res.status(200).send(cachedPhoto.buffer);
            }

            // 2. Fetch phone from database
            const query = `
                SELECT phone_id, status, is_archived, photos, colour_options, updated_at
                FROM phones
                WHERE phone_id = ? AND is_archived = 0 AND status = 'PUBLISHED'
                LIMIT 1
            `;
            const [rows] = await pool.execute(query, [phoneId]);
            if (!rows || rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Phone not found or unavailable' });
            }

            const row = rows[0];
            let photos = [];
            let colourOptions = [];

            try {
                photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : (row.photos || []);
            } catch {
                photos = [];
            }

            try {
                colourOptions = typeof row.colour_options === 'string' ? JSON.parse(row.colour_options) : (row.colour_options || []);
            } catch {
                colourOptions = [];
            }

            let targetValue = null;
            if (c === -1) {
                if (Array.isArray(photos) && i < photos.length) {
                    targetValue = photos[i];
                }
            } else if (c >= 0) {
                if (Array.isArray(colourOptions) && c < colourOptions.length) {
                    const col = colourOptions[c];
                    if (col && Array.isArray(col.photos) && i < col.photos.length) {
                        targetValue = col.photos[i];
                    }
                }
            }

            if (!targetValue || typeof targetValue !== 'string') {
                return res.status(404).json({ success: false, message: 'Photo not found' });
            }

            // Strictly validate data URI: only jpeg, png, webp
            const match = targetValue.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/i);
            if (!match) {
                return res.status(404).json({ success: false, message: 'Not a base64 photo' });
            }

            const contentType = match[1].toLowerCase();
            const base64Data = match[3];
            const buffer = Buffer.from(base64Data, 'base64');
            const etag = crypto.createHash('sha1').update(buffer).digest('hex');

            // Store in decoded photo LRU cache
            const rowUpdatedEpoch = row.updated_at ? new Date(row.updated_at).getTime() : 0;
            const liveKey = `${phoneId}:${c}:${i}:${rowUpdatedEpoch}`;
            photoLruCache.setPhoto(liveKey, { buffer, contentType, etag });

            const clientEtag = req.headers['if-none-match'];
            if (clientEtag && (clientEtag === etag || clientEtag === `"${etag}"`)) {
                return res.status(304).end();
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.setHeader('ETag', `"${etag}"`);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            return res.status(200).send(buffer);
        } catch (error) {
            console.error('PhoneController.getPhonePhoto error:', error.message);
            return res.status(500).json({ success: false, message: 'Failed to serve photo' });
        }
    }

    /**
     * POST /api/phones
     * Create a new phone record
     */
    async createPhone(req, res, next) {
        try {
            const phone = await phoneService.createPhone(req.body || {});
            listCache.clear();
            return res.status(201).json({
                success: true,
                message: 'Phone created successfully',
                data: phone
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/phones
     * Retrieve phones (defaults to non-archived; supports archived=yes / status=ARCHIVED / include_archived=true)
     */
    async getAllPhones(req, res, next) {
        const reqStart = Date.now();
        try {
            const {
                brand_id,
                status,
                phone_condition,
                availability,
                search,
                archived,
                is_archived,
                include_archived,
                is_new_arrival,
                view,
                card_view
            } = req.query;

            const filters = {
                brand_id,
                status,
                phone_condition,
                availability,
                search,
                archived,
                is_archived,
                include_archived,
                is_new_arrival,
                view,
                card_view
            };

            const cacheKey = listCache.generateKey(filters);
            const phones = await listCache.execute(cacheKey, async () => {
                return await phoneService.getAllPhones(filters);
            });

            if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_PERF === 'true') {
                const totalDuration = Date.now() - reqStart;
                console.log(`[PERF] GET /api/phones — count: ${phones.length}, duration: ${totalDuration}ms`);
            }

            res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

            return res.status(200).json({
                success: true,
                count: phones.length,
                data: phones
            });
        } catch (error) {
            console.error('PhoneController.getAllPhones error:', error.message);
            if (process.env.NODE_ENV === 'production') {
                return res.status(500).json({
                    success: false,
                    error: {
                        code: 'PHONE_CATALOGUE_UNAVAILABLE',
                        message: 'Unable to load phones at the moment.'
                    }
                });
            }
            next(error);
        }
    }

    /**
     * GET /api/phones/stock
     * Retrieve all phones for stock management screen
     */
    async getStockList(req, res, next) {
        try {
            const {
                search,
                brand_id,
                phone_condition,
                availability,
                stock_status,
                archived,
                is_archived,
                include_archived
            } = req.query;

            const phones = await phoneService.getStockList({
                search,
                brand_id,
                phone_condition,
                availability,
                stock_status,
                archived,
                is_archived,
                include_archived
            });

            return res.status(200).json({
                success: true,
                count: phones.length,
                data: phones
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/phones/:id/stock/add
     * Add stock quantity
     */
    async addStock(req, res, next) {
        try {
            const { id } = req.params;
            const result = await phoneService.addStock(id, req.body || {});
            let message = `Added ${result.added_quantity} units to '${result.name}'. Current stock is now ${result.current_stock}.`;
            if (result.stock_restoration_alert) {
                message += ` (${result.stock_restoration_alert.message})`;
            }
            return res.status(200).json({
                success: true,
                message,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/phones/:id/stock/remove
     * Deduct stock quantity
     */
    /**
     * GET /api/phones/:id/stock/history or /api/phones/stock/history
     * Retrieve stock adjustment history records
     */
    async getStockHistory(req, res, next) {
        try {
            const phone_id = req.params.id || req.query.phone_id;
            const { type, month } = req.query;
            const history = await phoneService.getStockHistory(phone_id, { type, month });
            return res.status(200).json({
                success: true,
                count: history.length,
                data: history
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/phones/:id/stock/history or /api/phones/stock/history
     * Delete history for a specific month
     */
    async deleteStockHistory(req, res, next) {
        try {
            const phone_id = req.params.id || req.query.phone_id || req.body?.phone_id;
            const month = req.query.month || req.body?.month;
            const type = req.query.type || req.body?.type;
            if (!month) {
                return res.status(400).json({
                    success: false,
                    error: 'Month parameter is required (format YYYY-MM).'
                });
            }
            const result = await phoneService.deleteStockHistoryByMonth(phone_id, month, { type });
            return res.status(200).json({
                success: true,
                message: `Successfully deleted history records for ${month}.`,
                deletedCount: result.deletedCount
            });
        } catch (error) {
            next(error);
        }
    }

    async removeStock(req, res, next) {
        try {
            const { id } = req.params;
            const result = await phoneService.removeStock(id, req.body || {});
            return res.status(200).json({
                success: true,
                message: `Deducted ${result.removed_quantity} units from '${result.name}'. Current stock is now ${result.current_stock}.`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/phones/:id/stock/sold-out
     * Mark phone as SOLD_OUT
     */
    async markSoldOut(req, res, next) {
        try {
            const { id } = req.params;
            const result = await phoneService.markSoldOut(id, req.body || {});
            return res.status(200).json({
                success: true,
                message: `Phone '${result.name}' marked as SOLD_OUT.`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH/POST /api/phones/:id/stock-toggle
     * Toggle phone in-stock / out-of-stock directly
     */
    async toggleStock(req, res, next) {
        try {
            const { id } = req.params;
            const inStock = req.body?.in_stock !== undefined
                ? Boolean(req.body.in_stock)
                : Boolean(req.body?.has_stock ?? req.body?.stock ?? true);
            const result = await phoneService.toggleStock(id, inStock);
            return res.status(200).json({
                success: true,
                message: inStock ? `Phone '${result.name}' marked as IN_STOCK` : `Phone '${result.name}' marked as OUT_OF_STOCK`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/phones/archived
     * Retrieve all archived phones
     */
    async getArchivedPhones(req, res, next) {
        try {
            const { brand_id, phone_condition, availability, search } = req.query;
            const phones = await phoneService.getArchivedPhones({
                brand_id,
                phone_condition,
                availability,
                search
            });

            return res.status(200).json({
                success: true,
                count: phones.length,
                data: phones
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/phones/:id
     * Retrieve a phone by ID (supports ?photos=url for full gallery URL rewriting)
     */
    async getPhoneById(req, res, next) {
        try {
            const { id } = req.params;
            const photosAsUrl = req.query.photos === 'url';
            const phone = await phoneService.getPhoneById(id, photosAsUrl);
            return res.status(200).json({
                success: true,
                data: phone
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/phones/:id/archive
     * Archive a phone
     */
    async archivePhone(req, res, next) {
        try {
            const { id } = req.params;
            const phone = await phoneService.archivePhone(id);
            listCache.clear();
            return res.status(200).json({
                success: true,
                message: `Phone '${phone.name}' has been archived successfully`,
                data: phone
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/phones/:id/restore
     * Restore an archived phone
     */
    async restorePhone(req, res, next) {
        try {
            const { id } = req.params;
            const restoreStatus = req.body?.status || 'DRAFT';
            const phone = await phoneService.restorePhone(id, restoreStatus);
            listCache.clear();
            return res.status(200).json({
                success: true,
                message: `Phone '${phone.name}' has been restored successfully`,
                data: phone
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/phones/:id
     * Update an existing phone record
     */
    async updatePhone(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await phoneService.updatePhone(id, req.body || {});
            listCache.clear();
            return res.status(200).json({
                success: true,
                message: 'Phone updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/phones/:id
     * Delete a phone by ID
     */
    async deletePhone(req, res, next) {
        try {
            const { id } = req.params;
            const result = await phoneService.deletePhone(id);
            listCache.clear();
            return res.status(200).json({
                success: true,
                message: `Phone '${result.name}' deleted successfully`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/phones/compare?ids=1,2,3
     * Compare 2 or 3 phones side-by-side (SRS C-05)
     */
    async comparePhones(req, res, next) {
        try {
            const rawIds = req.query.ids || req.query.phone_ids;

            const comparison = await phoneService.comparePhones(rawIds);

            return res.status(200).json({
                success: true,
                message: `Successfully retrieved side-by-side comparison for ${comparison.count} phones.`,
                data: comparison
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/phones/favorites?ids=1,2,3
     * Retrieve live phone card data for saved favorite IDs (SRS C-06)
     */
    async getFavorites(req, res, next) {
        try {
            const rawIds = req.query.ids || req.query.phone_ids;

            const favorites = await phoneService.getFavorites(rawIds);

            return res.status(200).json({
                success: true,
                count: favorites.count,
                data: favorites.data,
                unavailable_ids: favorites.unavailable_ids
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PhoneController();
