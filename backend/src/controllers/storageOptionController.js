const storageOptionService = require('../services/storageOptionService');

class StorageOptionController {
    /**
     * POST /api/storage-options
     * Creates a new storage option
     */
    async createStorageOption(req, res, next) {
        try {
            const { storage_name, capacity_gb } = req.body || {};
            const storageOption = await storageOptionService.createStorageOption({
                storage_name,
                capacity_gb
            });

            return res.status(201).json({
                success: true,
                message: 'Storage option created successfully',
                data: storageOption
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/storage-options
     * Retrieve all storage options
     */
    async getAllStorageOptions(req, res, next) {
        try {
            const options = await storageOptionService.getAllStorageOptions();
            return res.status(200).json({
                success: true,
                count: options.length,
                data: options
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/storage-options/:id
     * Retrieve a storage option by ID
     */
    async getStorageOptionById(req, res, next) {
        try {
            const { id } = req.params;
            const option = await storageOptionService.getStorageOptionById(id);
            return res.status(200).json({
                success: true,
                data: option
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/storage-options/:id
     * Update an existing storage option
     */
    async updateStorageOption(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await storageOptionService.updateStorageOption(id, req.body || {});
            return res.status(200).json({
                success: true,
                message: 'Storage option updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/storage-options/:id
     * Delete a storage option by ID
     */
    async deleteStorageOption(req, res, next) {
        try {
            const { id } = req.params;
            const result = await storageOptionService.deleteStorageOption(id);
            return res.status(200).json({
                success: true,
                message: `Storage option '${result.storage_name}' deleted successfully`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new StorageOptionController();
