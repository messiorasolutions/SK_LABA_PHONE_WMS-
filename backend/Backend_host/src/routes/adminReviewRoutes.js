const express = require('express');
const defaultController = require('../controllers/customerReviewController');
const defaultAuthMiddleware = require('../middleware/authMiddleware');
const {
    validateReviewIdParam,
    validateListAdminReviews,
    validateModerateReview
} = require('../validations/customerReviewValidation');

function createAdminReviewRouter({
    customerReviewController = defaultController,
    authMiddleware = defaultAuthMiddleware
} = {}) {
    const router = express.Router();

    // All dashboard moderation endpoints require active ADMIN authentication
    const adminMiddleware = [
        authMiddleware.authenticate,
        authMiddleware.requireAdmin
    ];

    // 1. GET /api/admin/reviews - List all reviews with filters, search, and pagination
    router.get('/', ...adminMiddleware, validateListAdminReviews, (req, res, next) => {
        customerReviewController.listReviewsForAdmin(req, res, next);
    });

    // 2. GET /api/admin/reviews/:id - Retrieve complete details of a review
    router.get('/:id', ...adminMiddleware, validateReviewIdParam, (req, res, next) => {
        customerReviewController.getReviewById(req, res, next);
    });

    // 3. PATCH /api/admin/reviews/:id/status - Approve or reject a review
    router.patch('/:id/status', ...adminMiddleware, validateReviewIdParam, validateModerateReview, (req, res, next) => {
        customerReviewController.moderateReview(req, res, next);
    });

    // Alias: PATCH /api/admin/reviews/:id
    router.patch('/:id', ...adminMiddleware, validateReviewIdParam, validateModerateReview, (req, res, next) => {
        customerReviewController.moderateReview(req, res, next);
    });

    return router;
}

const defaultRouter = createAdminReviewRouter();

module.exports = defaultRouter;
module.exports.createAdminReviewRouter = createAdminReviewRouter;
