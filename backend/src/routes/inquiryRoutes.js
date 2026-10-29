const express = require('express');
const defaultInquiryController = require('../controllers/inquiryController');
const defaultAuthMiddleware = require('../middleware/authMiddleware');
const { inquiryRateLimiter: defaultInquiryRateLimiter } = require('../middleware/rateLimiter');
const {
    validateInquiryIdParam,
    validateCreateInquiry,
    validateListInquiries,
    validateUpdateInquiryStatus
} = require('../validations/inquiryValidation');

function createInquiriesRouter({
    inquiryController = defaultInquiryController,
    authMiddleware = defaultAuthMiddleware,
    inquiryRateLimiter = defaultInquiryRateLimiter
} = {}) {
    const router = express.Router();

    // 1. POST /api/inquiries - Public customer inquiry submission (Rate-limited, no auth required)
    router.post('/', inquiryRateLimiter, validateCreateInquiry, (req, res, next) => {
        inquiryController.createInquiry(req, res, next);
    });

    // Dashboard Inquiry Management APIs - Protected for ADMIN and STAFF roles
    const protectedMiddleware = [
        authMiddleware.authenticate,
        authMiddleware.requireStaffOrAdmin
    ];

    // 2. GET /api/inquiries - List inquiries with pagination, searching, and filtering
    router.get('/', ...protectedMiddleware, validateListInquiries, (req, res, next) => {
        inquiryController.listInquiries(req, res, next);
    });

    // 3. GET /api/inquiries/:id - Retrieve complete details of an individual inquiry
    router.get('/:id', ...protectedMiddleware, validateInquiryIdParam, (req, res, next) => {
        inquiryController.getInquiryById(req, res, next);
    });

    // 4. PATCH /api/inquiries/:id/status - Update inquiry status and staff attribution
    router.patch('/:id/status', ...protectedMiddleware, validateInquiryIdParam, validateUpdateInquiryStatus, (req, res, next) => {
        inquiryController.updateInquiryStatus(req, res, next);
    });

    // 5. PATCH /api/inquiries/:id - Alias endpoint for updating status
    router.patch('/:id', ...protectedMiddleware, validateInquiryIdParam, validateUpdateInquiryStatus, (req, res, next) => {
        inquiryController.updateInquiryStatus(req, res, next);
    });

    return router;
}

const defaultRouter = createInquiriesRouter();

module.exports = defaultRouter;
module.exports.createInquiriesRouter = createInquiriesRouter;
