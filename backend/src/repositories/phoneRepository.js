const crypto = require('crypto');
const pool = require('../config/db');
const { calculatePhoneAvailability } = require('../utils/phoneAvailability');

const isBase64DataImage = (str) => typeof str === 'string' && /^data:image\/(jpeg|png|webp);base64,/i.test(str);
const getSha1 = (str) => crypto.createHash('sha1').update(str).digest('hex');

class PhoneRepository {
    /**
     * Safely parse JSON fields on a phone row
     * When isCardView=true, produces lightweight payload (primary photos only, URLs rewritten, no giant base64)
     * When photosAsUrl=true, rewrites all base64 photos across all colour options and photos array
     */
    _formatPhone(row, isCardView = false, photosAsUrl = false) {
        if (!row) return null;
        const jsonFields = [
            'storage_ids',
            'colour_options',
            'specification_ids',
            'accessory_ids',
            'free_accessories',
            'installment_plan_ids',
            'photos'
        ];

        const formatted = { ...row };
        for (const field of jsonFields) {
            if (formatted[field] && typeof formatted[field] === 'string') {
                try {
                    formatted[field] = JSON.parse(formatted[field]);
                } catch (e) { // eslint-disable-line no-unused-vars
                    // keep raw if not valid json
                }
            }
        }

        if (!Array.isArray(formatted.free_accessories)) {
            if (Array.isArray(formatted.accessory_ids) && formatted.accessory_ids.length > 0 && typeof formatted.accessory_ids[0] === 'string') {
                formatted.free_accessories = formatted.accessory_ids;
            } else {
                formatted.free_accessories = [];
            }
        }

        formatted.is_genuine_battery = formatted.is_genuine_battery === undefined || formatted.is_genuine_battery === null ? true : Boolean(formatted.is_genuine_battery);
        formatted.is_original_housing = formatted.is_original_housing === undefined || formatted.is_original_housing === null ? true : Boolean(formatted.is_original_housing);

        const updatedAtEpoch = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        const phoneId = formatted.phone_id;
        const sha1ToUrl = new Map();

        const resolvePhotoUrl = (photoStr, c, i) => {
            if (!isBase64DataImage(photoStr)) {
                return photoStr; // Normal URLs, relative paths, etc. pass through unchanged
            }
            const hash = getSha1(photoStr);
            if (sha1ToUrl.has(hash)) {
                return sha1ToUrl.get(hash);
            }
            const photoUrl = `/api/phones/${phoneId}/photo?c=${c}&i=${i}&v=${updatedAtEpoch}`;
            sha1ToUrl.set(hash, photoUrl);
            return photoUrl;
        };

        // Optimize card-view payload size (shrinks JSON from megabytes to kilobytes via URL rewrites)
        if (isCardView) {
            let primaryColourPhoto = '';
            if (Array.isArray(formatted.colour_options) && formatted.colour_options.length > 0) {
                // Keep only primary photo per color option
                formatted.colour_options = formatted.colour_options.map((col, cIdx) => {
                    const colPhotos = Array.isArray(col.photos) ? col.photos : [];
                    const firstPhoto = colPhotos[0] || '';
                    let rewrittenPhoto = '';
                    if (firstPhoto) {
                        rewrittenPhoto = resolvePhotoUrl(firstPhoto, cIdx, 0);
                        if (!primaryColourPhoto) {
                            primaryColourPhoto = rewrittenPhoto;
                        }
                    }
                    return {
                        id: col.id || `color_${cIdx}`,
                        name: col.name || col.color_name || `Color #${cIdx + 1}`,
                        color_name: col.color_name || col.name || `Color #${cIdx + 1}`,
                        color_code: col.color_code || col.color || '#374151',
                        quantity: col.quantity !== undefined ? Number(col.quantity) : 0,
                        storage_quantities: col.storage_quantities || {},
                        photos: rewrittenPhoto ? [rewrittenPhoto] : []
                    };
                });
            }

            let primaryPhoto = primaryColourPhoto;
            if (!primaryPhoto && Array.isArray(formatted.photos) && formatted.photos.length > 0) {
                primaryPhoto = resolvePhotoUrl(formatted.photos[0], -1, 0);
            }

            formatted.main_photo = primaryPhoto || '';
            formatted.photos = formatted.main_photo ? [formatted.main_photo] : [];

            // Remove unnecessary large off-page fields from listing card
            delete formatted.description;
            delete formatted.specification_ids;
            delete formatted.accessory_ids;
            delete formatted.free_accessories;
            delete formatted.installment_plan_ids;
        } else if (photosAsUrl) {
            // Full gallery photo URL rewriting (used by PhoneDetailModal when photos=url)
            let primaryColourPhoto = '';
            if (Array.isArray(formatted.colour_options) && formatted.colour_options.length > 0) {
                formatted.colour_options = formatted.colour_options.map((col, cIdx) => {
                    const colPhotos = Array.isArray(col.photos) ? col.photos : [];
                    const rewrittenPhotos = colPhotos.map((p, pIdx) => {
                        const url = resolvePhotoUrl(p, cIdx, pIdx);
                        if (!primaryColourPhoto) primaryColourPhoto = url;
                        return url;
                    });
                    return {
                        ...col,
                        photos: rewrittenPhotos
                    };
                });
            }

            if (Array.isArray(formatted.photos)) {
                formatted.photos = formatted.photos.map((p, pIdx) => resolvePhotoUrl(p, -1, pIdx));
            }

            formatted.main_photo = primaryColourPhoto || (Array.isArray(formatted.photos) && formatted.photos[0]) || '';
        }

        formatted.current_stock = Number(formatted.current_stock ?? 0);
        formatted.low_stock_level = Number(formatted.low_stock_level ?? 5);
        formatted.stock = formatted.current_stock;
        formatted.stock_quantity = formatted.current_stock;
        formatted.is_archived = Boolean(formatted.is_archived || formatted.status === 'ARCHIVED');
        formatted.is_new_arrival = Boolean(formatted.is_new_arrival);
        formatted.product_source = row.product_source || 'INVENTORY';
        formatted.ownership_type = row.ownership_type || 'PLATFORM_OWNED';
        formatted.marketplace_listing_id = row.marketplace_listing_id || null;
        if (row.battery_health !== undefined && row.battery_health !== null) {
            const rawBh = String(row.battery_health).trim();
            formatted.battery_health = rawBh.length > 0 ? (rawBh.endsWith('%') ? rawBh : `${rawBh}%`) : null;
        } else {
            formatted.battery_health = null;
        }
        formatted.is_genuine_battery = row.is_genuine_battery !== undefined && row.is_genuine_battery !== null ? Boolean(row.is_genuine_battery) : true;
        formatted.is_original_housing = row.is_original_housing !== undefined && row.is_original_housing !== null ? Boolean(row.is_original_housing) : true;
        formatted.display_size = row.display_size ? String(row.display_size).trim() : null;
        formatted.used_condition_grade = row.used_condition_grade || null;
        formatted.availability = calculatePhoneAvailability(
            formatted.current_stock,
            formatted.low_stock_level,
            formatted.availability
        );
        return formatted;
    }

    /**
     * Insert a new phone record
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const query = `
            INSERT INTO phones (
                name, brand_id, phone_condition, price,
                storage_ids, colour_options, specification_ids,
                warranty, accessory_ids, free_accessories, description,
                low_stock_level, current_stock, availability, installment_enabled,
                installment_plan_ids, status, is_archived, is_new_arrival, photos,
                battery_health, is_genuine_battery, is_original_housing, display_size
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.name,
            data.brand_id,
            data.phone_condition,
            data.price,
            data.storage_ids ? JSON.stringify(data.storage_ids) : null,
            data.colour_options ? JSON.stringify(data.colour_options) : null,
            data.specification_ids ? JSON.stringify(data.specification_ids) : null,
            data.warranty || null,
            data.accessory_ids ? JSON.stringify(data.accessory_ids) : null,
            data.free_accessories ? JSON.stringify(data.free_accessories) : (data.accessory_ids ? JSON.stringify(data.accessory_ids) : null),
            data.description || null,
            data.low_stock_level !== undefined ? data.low_stock_level : 5,
            data.current_stock !== undefined ? data.current_stock : 0,
            data.availability || 'SOLD_OUT',
            data.installment_enabled ? 1 : 0,
            data.installment_plan_ids ? JSON.stringify(data.installment_plan_ids) : null,
            data.status || 'DRAFT',
            data.is_archived ? 1 : 0,
            data.is_new_arrival ? 1 : 0,
            data.photos ? JSON.stringify(data.photos) : null,
            data.battery_health !== undefined && data.battery_health !== null && data.battery_health !== '' ? String(data.battery_health).trim() : null,
            data.is_genuine_battery !== undefined ? (data.is_genuine_battery ? 1 : 0) : 1,
            data.is_original_housing !== undefined ? (data.is_original_housing ? 1 : 0) : 1,
            data.display_size !== undefined && data.display_size !== null && data.display_size !== '' ? String(data.display_size).trim() : null
        ];

        const [result] = await pool.execute(query, values);
        return this.findById(result.insertId);
    }

    /**
     * Find a phone by ID with brand information joined
     * @param {number|string} phone_id
     * @returns {Promise<Object|null>}
     */
    async findById(phone_id, photosAsUrl = false) {
        const query = `
            SELECT 
                p.*,
                b.brand_name
            FROM phones p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE p.phone_id = ?
        `;
        const [rows] = await pool.execute(query, [phone_id]);
        return rows.length > 0 ? this._formatPhone(rows[0], false, photosAsUrl) : null;
    }

    /**
     * Get all phones with optional filtering
     * Defaults to non-archived phones unless archived is explicitly requested
     * @param {Object} [filters]
     * @returns {Promise<Array>}
     */
    async findAll(filters = {}) {
        const isCardView = Boolean(
            filters.view === 'card' ||
            filters.card_view === true ||
            filters.card_view === 'true'
        );

        // In card view, project only lightweight columns to avoid retrieving off-page BLOBs/TEXT (descriptions)
        const selectColumns = isCardView
            ? `
                p.phone_id,
                p.name,
                p.brand_id,
                b.brand_name,
                p.phone_condition,
                p.price,
                p.storage_ids,
                p.colour_options,
                p.low_stock_level,
                p.current_stock,
                p.availability,
                p.installment_enabled,
                p.status,
                p.is_archived,
                p.is_new_arrival,
                p.photos,
                p.warranty,
                p.created_at,
                p.product_source,
                p.ownership_type,
                p.marketplace_listing_id,
                p.battery_health,
                p.is_genuine_battery,
                p.is_original_housing,
                p.display_size
              `
            : `
                p.*,
                b.brand_name
              `;

        let query = `
            SELECT 
                ${selectColumns}
            FROM phones p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE 1=1
        `;
        const values = [];

        const isArchiveRequested =
            filters.archived === true ||
            filters.archived === 'true' ||
            filters.archived === 'yes' ||
            filters.archived === '1' ||
            filters.is_archived === true ||
            filters.is_archived === 'true' ||
            filters.is_archived === 'yes' ||
            filters.is_archived === '1' ||
            filters.status === 'ARCHIVED';

        const isIncludeAllRequested =
            filters.archived === 'all' ||
            filters.include_archived === true ||
            filters.include_archived === 'true' ||
            filters.status === 'ALL';

        if (isArchiveRequested) {
            query += ` AND (p.is_archived = 1 OR p.status = 'ARCHIVED')`;
        } else if (!isIncludeAllRequested) {
            // Normal list: hide archived phones
            query += ` AND p.is_archived = 0 AND p.status != 'ARCHIVED'`;
        }

        // Sellers phones must only appear in marketplace, never in standard smartphone section
        if (!filters.include_marketplace) {
            query += ` AND (p.product_source != 'MARKETPLACE' OR p.product_source IS NULL) AND p.marketplace_listing_id IS NULL`;
        }

        if (filters.brand_id) {
            query += ` AND p.brand_id = ?`;
            values.push(filters.brand_id);
        }
        if (filters.status && filters.status !== 'ARCHIVED' && filters.status !== 'ALL') {
            query += ` AND p.status = ?`;
            values.push(filters.status);
        }
        if (filters.phone_condition) {
            query += ` AND p.phone_condition = ?`;
            values.push(filters.phone_condition);
        }
        if (filters.availability) {
            const cleanAvail = String(filters.availability).trim().toUpperCase();
            if (cleanAvail === 'SOLD_OUT') {
                query += ` AND ((p.current_stock <= 0 AND (p.availability IS NULL OR p.availability != 'COMING_SOON')) OR p.availability = 'SOLD_OUT')`;
            } else if (cleanAvail === 'LOW_STOCK') {
                query += ` AND ((p.current_stock > 0 AND p.current_stock <= COALESCE(p.low_stock_level, 5)) OR p.availability = 'LOW_STOCK')`;
            } else if (cleanAvail === 'IN_STOCK') {
                query += ` AND (p.current_stock > COALESCE(p.low_stock_level, 5) AND (p.availability IS NULL OR p.availability != 'COMING_SOON'))`;
            } else if (cleanAvail === 'COMING_SOON') {
                query += ` AND p.availability = 'COMING_SOON' AND p.current_stock <= 0`;
            } else {
                query += ` AND p.availability = ?`;
                values.push(cleanAvail);
            }
        }
        if (filters.search) {
            query += ` AND (p.name LIKE ? OR b.brand_name LIKE ?)`;
            const keyword = `%${filters.search}%`;
            values.push(keyword, keyword);
        }
        if (filters.is_new_arrival !== undefined && filters.is_new_arrival !== null && filters.is_new_arrival !== '') {
            const isNA = filters.is_new_arrival === true || filters.is_new_arrival === 'true' || filters.is_new_arrival === '1' || filters.is_new_arrival === 1;
            if (isNA) {
                query += ` AND p.is_new_arrival = 1`;
            }
        }

        query += ` ORDER BY p.phone_id DESC`;

        const [rows] = await pool.execute(query, values);
        return rows.map(row => this._formatPhone(row, isCardView));
    }

    /**
     * Get stock list with stock-specific filters
     * @param {Object} [filters]
     * @returns {Promise<Array>}
     */
    async findAllStock(filters = {}) {
        let query = `
            SELECT 
                p.*,
                b.brand_name
            FROM phones p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE 1=1
        `;
        const values = [];

        const isArchiveRequested =
            filters.archived === true ||
            filters.archived === 'true' ||
            filters.archived === 'yes' ||
            filters.archived === '1' ||
            filters.is_archived === true ||
            filters.is_archived === 'true' ||
            filters.is_archived === 'yes' ||
            filters.is_archived === '1';

        const isIncludeAllRequested =
            filters.archived === 'all' ||
            filters.include_archived === true ||
            filters.include_archived === 'true';

        if (isArchiveRequested) {
            query += ` AND (p.is_archived = 1 OR p.status = 'ARCHIVED')`;
        } else if (!isIncludeAllRequested) {
            query += ` AND p.is_archived = 0 AND p.status != 'ARCHIVED'`;
        }

        if (filters.brand_id) {
            query += ` AND p.brand_id = ?`;
            values.push(filters.brand_id);
        }
        if (filters.phone_condition) {
            query += ` AND p.phone_condition = ?`;
            values.push(filters.phone_condition);
        }
        if (filters.availability) {
            const cleanAvail = String(filters.availability).trim().toUpperCase();
            if (cleanAvail === 'SOLD_OUT') {
                query += ` AND ((p.current_stock <= 0 AND (p.availability IS NULL OR p.availability != 'COMING_SOON')) OR p.availability = 'SOLD_OUT')`;
            } else if (cleanAvail === 'LOW_STOCK') {
                query += ` AND ((p.current_stock > 0 AND p.current_stock <= COALESCE(p.low_stock_level, 5)) OR p.availability = 'LOW_STOCK')`;
            } else if (cleanAvail === 'IN_STOCK') {
                query += ` AND (p.current_stock > COALESCE(p.low_stock_level, 5) AND (p.availability IS NULL OR p.availability != 'COMING_SOON'))`;
            } else if (cleanAvail === 'COMING_SOON') {
                query += ` AND p.availability = 'COMING_SOON' AND p.current_stock <= 0`;
            } else {
                query += ` AND p.availability = ?`;
                values.push(cleanAvail);
            }
        }
        if (filters.search) {
            query += ` AND (p.name LIKE ? OR b.brand_name LIKE ?)`;
            const keyword = `%${filters.search}%`;
            values.push(keyword, keyword);
        }
        if (filters.is_new_arrival !== undefined && filters.is_new_arrival !== null && filters.is_new_arrival !== '') {
            const isNA = filters.is_new_arrival === true || filters.is_new_arrival === 'true' || filters.is_new_arrival === '1' || filters.is_new_arrival === 1;
            if (isNA) {
                query += ` AND p.is_new_arrival = 1`;
            }
        }

        // Stock status filter
        if (filters.stock_status) {
            const statusLower = String(filters.stock_status).toLowerCase();
            if (statusLower === 'low' || statusLower === 'low_stock') {
                query += ` AND p.current_stock <= p.low_stock_level AND p.current_stock > 0`;
            } else if (statusLower === 'out' || statusLower === 'sold_out' || statusLower === 'out_of_stock') {
                query += ` AND (p.current_stock = 0 OR p.availability = 'SOLD_OUT')`;
            } else if (statusLower === 'in_stock') {
                query += ` AND p.current_stock > COALESCE(p.low_stock_level, 5) AND (p.availability IS NULL OR p.availability != 'COMING_SOON')`;
            }
        }

        query += ` ORDER BY p.phone_id DESC`;

        const [rows] = await pool.execute(query, values);
        return rows.map(row => this._formatPhone(row, isCardView));
    }

    /**
     * Add stock quantity to a phone
     * @param {number|string} phone_id
     * @param {number} quantity
     * @param {string} newAvailability
     * @returns {Promise<Object>}
     */
    async updateStockWithColours(phone_id, newTotalStock, newAvailability, updatedColourOptions) {
        const query = `
            UPDATE phones 
            SET current_stock = ?,
                availability = ?,
                colour_options = ?
            WHERE phone_id = ?
        `;
        await pool.execute(query, [newTotalStock, newAvailability, JSON.stringify(updatedColourOptions), phone_id]);
        return this.findById(phone_id);
    }

    async addStock(phone_id, quantity, newAvailability) {
        const query = `
            UPDATE phones 
            SET current_stock = current_stock + ?,
                availability = ?
            WHERE phone_id = ?
        `;
        await pool.execute(query, [quantity, newAvailability, phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Deduct stock quantity from a phone
     * @param {number|string} phone_id
     * @param {number} quantity
     * @param {string} newAvailability
     * @returns {Promise<Object>}
     */
    async removeStock(phone_id, quantity, newAvailability) {
        const query = `
            UPDATE phones 
            SET current_stock = GREATEST(0, CAST(current_stock AS SIGNED) - ?),
                availability = ?
            WHERE phone_id = ?
        `;
        await pool.execute(query, [quantity, newAvailability, phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Mark a phone as SOLD_OUT
     * @param {number|string} phone_id
     * @param {boolean} [resetQuantity=false]
     * @returns {Promise<Object>}
     */
    async markSoldOut(phone_id, resetQuantity = true) {
        // Enforce consistent availability & stock: a sold out phone has 0 stock
        const query = `UPDATE phones SET availability = 'SOLD_OUT', current_stock = 0 WHERE phone_id = ?`;
        await pool.execute(query, [phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Toggle phone in-stock / out-of-stock status directly
     * @param {number|string} phone_id
     * @param {boolean} inStock
     * @returns {Promise<Object>}
     */
    async toggleStock(phone_id, inStock) {
        const query = inStock
            ? `UPDATE phones SET availability = 'IN_STOCK', current_stock = GREATEST(10, current_stock) WHERE phone_id = ?`
            : `UPDATE phones SET availability = 'SOLD_OUT', current_stock = 0 WHERE phone_id = ?`;
        await pool.execute(query, [phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Archive a phone by ID
     * @param {number|string} phone_id
     * @returns {Promise<Object>}
     */
    async archive(phone_id) {
        const query = `UPDATE phones SET is_archived = 1, status = 'ARCHIVED' WHERE phone_id = ?`;
        await pool.execute(query, [phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Restore an archived phone by ID
     * @param {number|string} phone_id
     * @param {string} [restoreStatus='DRAFT']
     * @returns {Promise<Object>}
     */
    async restore(phone_id, restoreStatus = 'DRAFT') {
        const cleanStatus = ['PUBLISHED', 'DRAFT'].includes(String(restoreStatus).toUpperCase())
            ? String(restoreStatus).toUpperCase()
            : 'DRAFT';
        const query = `UPDATE phones SET is_archived = 0, status = ? WHERE phone_id = ?`;
        await pool.execute(query, [cleanStatus, phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Update an existing phone record
     * @param {number|string} phone_id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(phone_id, data) {
        const query = `
            UPDATE phones SET
                name = ?,
                brand_id = ?,
                phone_condition = ?,
                price = ?,
                storage_ids = ?,
                colour_options = ?,
                specification_ids = ?,
                warranty = ?,
                accessory_ids = ?,
                free_accessories = ?,
                description = ?,
                low_stock_level = ?,
                current_stock = ?,
                availability = ?,
                installment_enabled = ?,
                installment_plan_ids = ?,
                status = ?,
                is_archived = ?,
                is_new_arrival = ?,
                photos = ?,
                battery_health = ?,
                is_genuine_battery = ?,
                is_original_housing = ?,
                display_size = ?
            WHERE phone_id = ?
        `;

        const values = [
            data.name,
            data.brand_id,
            data.phone_condition,
            data.price,
            data.storage_ids ? JSON.stringify(data.storage_ids) : null,
            data.colour_options ? JSON.stringify(data.colour_options) : null,
            data.specification_ids ? JSON.stringify(data.specification_ids) : null,
            data.warranty || null,
            data.accessory_ids ? JSON.stringify(data.accessory_ids) : null,
            data.free_accessories ? JSON.stringify(data.free_accessories) : (data.accessory_ids ? JSON.stringify(data.accessory_ids) : null),
            data.description || null,
            data.low_stock_level !== undefined ? data.low_stock_level : 5,
            data.current_stock !== undefined ? data.current_stock : 0,
            data.availability,
            data.installment_enabled ? 1 : 0,
            data.installment_plan_ids ? JSON.stringify(data.installment_plan_ids) : null,
            data.status,
            data.is_archived ? 1 : 0,
            data.is_new_arrival ? 1 : 0,
            data.photos ? JSON.stringify(data.photos) : null,
            data.battery_health !== undefined && data.battery_health !== null && data.battery_health !== '' ? String(data.battery_health).trim() : null,
            data.is_genuine_battery !== undefined ? (data.is_genuine_battery ? 1 : 0) : 1,
            data.is_original_housing !== undefined ? (data.is_original_housing ? 1 : 0) : 1,
            data.display_size !== undefined && data.display_size !== null && data.display_size !== '' ? String(data.display_size).trim() : null,
            phone_id
        ];

        await pool.execute(query, values);
        return this.findById(phone_id);
    }

    /**
     * Delete a phone by ID
     * @param {number|string} phone_id
     * @returns {Promise<boolean>}
     */
    async delete(phone_id) {
        const query = `DELETE FROM phones WHERE phone_id = ?`;
        const [result] = await pool.execute(query, [phone_id]);
        return result.affectedRows > 0;
    }
}

module.exports = new PhoneRepository();
