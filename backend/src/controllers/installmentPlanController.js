const installmentPlanService = require('../services/installmentPlanService');

class InstallmentPlanController {
    /**
     * POST /api/installment-plans
     * Create a new installment plan
     */
    async createPlan(req, res, next) {
        try {
            const plan = await installmentPlanService.createPlan(req.body || {});
            return res.status(201).json({
                success: true,
                message: 'Instalment plan created successfully',
                data: plan
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/installment-plans
     * Retrieve all installment plans (supports ?is_active=true & ?search=...)
     */
    async getAllPlans(req, res, next) {
        try {
            const { is_active, search } = req.query;
            const plans = await installmentPlanService.getAllPlans({ is_active, search });
            return res.status(200).json({
                success: true,
                count: plans.length,
                data: plans
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/installment-plans/:id
     * Retrieve a single installment plan by ID
     */
    async getPlanById(req, res, next) {
        try {
            const { id } = req.params;
            const plan = await installmentPlanService.getPlanById(id);
            return res.status(200).json({
                success: true,
                data: plan
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/installment-plans/:id
     * Update an existing installment plan
     */
    async updatePlan(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await installmentPlanService.updatePlan(id, req.body || {});
            return res.status(200).json({
                success: true,
                message: 'Instalment plan updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/installment-plans/:id/toggle-status
     * Toggle active/inactive status
     */
    async toggleStatus(req, res, next) {
        try {
            const { id } = req.params;
            const plan = await installmentPlanService.toggleStatus(id);
            return res.status(200).json({
                success: true,
                message: `Instalment plan status changed to ${plan.is_active ? 'Active' : 'Inactive'}`,
                data: plan
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/installment-plans/:id
     * Delete an installment plan
     */
    async deletePlan(req, res, next) {
        try {
            const { id } = req.params;
            const result = await installmentPlanService.deletePlan(id);
            return res.status(200).json({
                success: true,
                message: `Instalment plan '${result.plan_name}' deleted successfully`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/phones/:id/installments
     * Calculate and return installment breakdown for a phone (C-03)
     */
    async getPhoneInstallments(req, res, next) {
        try {
            const { id } = req.params;
            const result = await installmentPlanService.calculatePhoneInstallments(id);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new InstallmentPlanController();

