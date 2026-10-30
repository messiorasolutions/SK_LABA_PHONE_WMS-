const phoneService = require('../services/phoneService');

class PhoneController {
    /**
     * POST /api/phones
     * Create a new phone record
     */
    async createPhone(req, res, next) {
        try {
            const phone = await phoneService.createPhone(req.body || {});
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
        try {
            const {
                brand_id,
                status,
                phone_condition,
                availability,
                search,
                archived,
                is_archived,
                include_archived
            } = req.query;

            const phones = await phoneService.getAllPhones({
                brand_id,
                status,
                phone_condition,
                availability,
                search,
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
     * Retrieve a phone by ID
     */
    async getPhoneById(req, res, next) {
        try {
            const { id } = req.params;
            const phone = await phoneService.getPhoneById(id);
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
