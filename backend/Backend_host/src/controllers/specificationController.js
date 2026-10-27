const specificationService = require('../services/specificationService');

class SpecificationController {
    /**
     * POST /api/specifications
     * Create a new specification
     */
    async createSpecification(req, res, next) {
        try {
            const { specification_name, specification_type, description, is_active } = req.body || {};
            const spec = await specificationService.createSpecification({
                specification_name,
                specification_type,
                description,
                is_active
            });

            return res.status(201).json({
                success: true,
                message: 'Specification created successfully',
                data: spec
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/specifications
     * Retrieve all specifications (supports ?type=TECHNICAL or ?type=ACCESSORY)
     */
    async getAllSpecifications(req, res, next) {
        try {
            const { type } = req.query;
            const specs = await specificationService.getAllSpecifications(type);

            return res.status(200).json({
                success: true,
                count: specs.length,
                data: specs
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/specifications/:id
     * Retrieve a specification by ID
     */
    async getSpecificationById(req, res, next) {
        try {
            const { id } = req.params;
            const spec = await specificationService.getSpecificationById(id);

            return res.status(200).json({
                success: true,
                data: spec
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/specifications/:id
     * Update an existing specification
     */
    async updateSpecification(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await specificationService.updateSpecification(id, req.body || {});

            return res.status(200).json({
                success: true,
                message: 'Specification updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/specifications/:id
     * Delete a specification by ID
     */
    async deleteSpecification(req, res, next) {
        try {
            const { id } = req.params;
            const result = await specificationService.deleteSpecification(id);

            return res.status(200).json({
                success: true,
                message: `Specification '${result.specification_name}' deleted successfully`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SpecificationController();
