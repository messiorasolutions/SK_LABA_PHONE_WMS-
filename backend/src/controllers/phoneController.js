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
     * Retrieve all phones (with optional filters)
     */
    async getAllPhones(req, res, next) {
        try {
            const { brand_id, status, phone_condition, availability, search } = req.query;
            const phones = await phoneService.getAllPhones({
                brand_id,
                status,
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
}

module.exports = new PhoneController();
