const defaultCustomerReviewService = require('../services/customerReviewService');

class CustomerReviewController {
    constructor(customerReviewService = defaultCustomerReviewService) {
        this.customerReviewService = customerReviewService;
    }

    /**
     * POST /api/reviews
     * Submit a public customer review
     */
    async submitReview(req, res, next) {
        try {
            const review = await this.customerReviewService.submitReview(req.body);
            return res.status(201).json({
                success: true,
                message: 'Thank you for sharing your experience! Your review has been submitted successfully and will appear on our website after approval.',
                data: review
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reviews
     * Public read-only endpoint returning only Approved customer reviews
     */
    async getApprovedReviews(req, res, next) {
        try {
            const result = await this.customerReviewService.getApprovedReviews(req.query);
            return res.status(200).json({
                success: true,
                count: result.reviews.length,
                data: result.reviews,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/admin/reviews
     * Dashboard endpoint to list all reviews with filters, search, and pagination
     */
    async listReviewsForAdmin(req, res, next) {
        try {
            const result = await this.customerReviewService.listReviewsForAdmin(req.query);
            return res.status(200).json({
                success: true,
                data: result.reviews,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/admin/reviews/:id
     * Dashboard endpoint to retrieve full details of an individual review
     */
    async getReviewById(req, res, next) {
        try {
            const review = await this.customerReviewService.getReviewById(req.params.id);
            return res.status(200).json({
                success: true,
                data: review
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/admin/reviews/:id/status
     * Dashboard endpoint to approve or reject a customer review
     */
    async moderateReview(req, res, next) {
        try {
            const { status } = req.body;
            const updated = await this.customerReviewService.moderateReview(
                req.params.id,
                status,
                req.user
            );
            return res.status(200).json({
                success: true,
                message: `Review successfully ${status.toLowerCase()}.`,
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CustomerReviewController();
module.exports.CustomerReviewController = CustomerReviewController;
