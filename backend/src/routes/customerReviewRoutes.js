const express = require('express');
const defaultController = require('../controllers/customerReviewController');
const { customerReviewRateLimiter: defaultRateLimiter } = require('../middleware/rateLimiter');
const {
    validateCreateReview,
    validateListApprovedReviews
} = require('../validations/customerReviewValidation');

function createCustomerReviewRouter({
    customerReviewController = defaultController,
    customerReviewRateLimiter = defaultRateLimiter
} = {}) {
    const router = express.Router();

    // 1. POST /api/reviews - Public customer review submission
    router.post('/', customerReviewRateLimiter, validateCreateReview, (req, res, next) => {
        customerReviewController.submitReview(req, res, next);
    });

    // 2. GET /api/reviews - Public website listing of approved reviews only
    router.get('/', validateListApprovedReviews, (req, res, next) => {
        customerReviewController.getApprovedReviews(req, res, next);
    });

    return router;
}

const defaultRouter = createCustomerReviewRouter();

module.exports = defaultRouter;
module.exports.createCustomerReviewRouter = createCustomerReviewRouter;
