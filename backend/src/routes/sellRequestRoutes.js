const express = require('express');
const defaultSellRequestController = require('../controllers/sellRequestController');
const defaultAuthMiddleware = require('../middleware/authMiddleware');
const { sellRequestRateLimiter: defaultSellRequestRateLimiter } = require('../middleware/rateLimiter');
const { handleSellRequestUpload: defaultUploadMiddleware } = require('../middleware/uploadMiddleware');
const {
    validateSellRequestIdParam,
    validateCreateSellRequest,
    validateListSellRequests,
    validateUpdateSellRequestStatus,
    validateAssignSellRequest
} = require('../validations/sellRequestValidation');

function createSellRequestsRouter({
    sellRequestController = defaultSellRequestController,
    authMiddleware = defaultAuthMiddleware,
    sellRequestRateLimiter = defaultSellRequestRateLimiter,
    uploadMiddleware = defaultUploadMiddleware
} = {}) {
    const router = express.Router();

    // 1. POST /api/sell-requests - Public customer sell-your-phone submission (C-14)
    // Rate-limited, multipart/form-data upload supported, no dashboard login required
    router.post(
        '/',
        sellRequestRateLimiter,
        uploadMiddleware,
        validateCreateSellRequest,
        (req, res, next) => {
            sellRequestController.createSellRequest(req, res, next);
        }
    );

    // Dashboard Sell Request Management APIs - Protected for ADMIN and STAFF roles (ST-08)
    const protectedMiddleware = [
        authMiddleware.authenticate,
        authMiddleware.requireStaffOrAdmin
    ];

    // 2. GET /api/sell-requests - List sell requests with pagination, searching, and filtering
    router.get(
        '/',
        ...protectedMiddleware,
        validateListSellRequests,
        (req, res, next) => {
            sellRequestController.listSellRequests(req, res, next);
        }
    );

    // 3. GET /api/sell-requests/:id - Retrieve complete details of an individual sell request
    router.get(
        '/:id',
        ...protectedMiddleware,
        validateSellRequestIdParam,
        (req, res, next) => {
            sellRequestController.getSellRequestById(req, res, next);
        }
    );

    // 4. GET /api/sell-requests/:id/photos/:filename - Authenticated private delivery of customer trade-in photos
    router.get(
        '/:id/photos/:filename',
        ...protectedMiddleware,
        validateSellRequestIdParam,
        (req, res, next) => {
            sellRequestController.getSellRequestPhoto(req, res, next);
        }
    );

    // 5. PATCH /api/sell-requests/:id/status - Update sell request status and staff attribution
    router.patch(
        '/:id/status',
        ...protectedMiddleware,
        validateSellRequestIdParam,
        validateUpdateSellRequestStatus,
        (req, res, next) => {
            sellRequestController.updateSellRequestStatus(req, res, next);
        }
    );

    // 6. PATCH /api/sell-requests/:id - Alias endpoint for updating status
    router.patch(
        '/:id',
        ...protectedMiddleware,
        validateSellRequestIdParam,
        validateUpdateSellRequestStatus,
        (req, res, next) => {
            sellRequestController.updateSellRequestStatus(req, res, next);
        }
    );

    // 7. PATCH /api/sell-requests/:id/assign - Assign or reassign request to staff
    router.patch(
        '/:id/assign',
        ...protectedMiddleware,
        validateSellRequestIdParam,
        validateAssignSellRequest,
        (req, res, next) => {
            sellRequestController.assignSellRequest(req, res, next);
        }
    );

    return router;
}

const defaultRouter = createSellRequestsRouter();

module.exports = defaultRouter;
module.exports.createSellRequestsRouter = createSellRequestsRouter;
