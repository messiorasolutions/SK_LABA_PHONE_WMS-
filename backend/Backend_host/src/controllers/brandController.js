const brandService = require('../services/brandService');

class BrandController {
    /**
     * POST /api/brands
     * Creates a new brand
     */
    async createBrand(req, res, next) {
        try {
            const { brand_name, description, is_active } = req.body || {};

            const brand = await brandService.createBrand({
                brand_name,
                description,
                is_active
            });

            return res.status(201).json({
                success: true,
                message: 'Brand created successfully',
                data: brand
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/brands
     * Retrieve all brands
     */
    async getAllBrands(req, res, next) {
        try {
            const brands = await brandService.getAllBrands();
            return res.status(200).json({
                success: true,
                count: brands.length,
                data: brands
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/brands/:id
     * Retrieve a brand by ID
     */
    async getBrandById(req, res, next) {
        try {
            const { id } = req.params;
            const brand = await brandService.getBrandById(id);
            return res.status(200).json({
                success: true,
                data: brand
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/brands/:id
     * Update an existing brand
     */
    async updateBrand(req, res, next) {
        try {
            const { id } = req.params;
            const updatedBrand = await brandService.updateBrand(id, req.body || {});
            return res.status(200).json({
                success: true,
                message: 'Brand updated successfully',
                data: updatedBrand
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/brands/:id
     * Delete a brand by ID
     */
    async deleteBrand(req, res, next) {
        try {
            const { id } = req.params;
            const result = await brandService.deleteBrand(id);
            return res.status(200).json({
                success: true,
                message: `Brand '${result.brand_name}' deleted successfully`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BrandController();
