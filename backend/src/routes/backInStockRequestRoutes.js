const express = require('express');
const defaultController = require('../controllers/backInStockRequestController');
const defaultAuthMiddleware = require('../middleware/authMiddleware');
const { backInStockRateLimiter: defaultRateLimiter } = require('../middleware/rateLimiter');
const {
    validateBackInStockRequestIdParam,
    validatePhoneIdParam,
    validateCreateBackInStockRequest,
    validateListBackInStockRequests,
    validateUpdateBackInStockRequestStatus,
    validateAssignBackInStockRequest
} = require('../validations/backInStockRequestValidation');

function createBackInStockRequestRouter({
    backInStockRequestController = defaultController,
    authMiddleware = defaultAuthMiddleware,
    backInStockRateLimiter = defaultRateLimiter
} = {}) {
    const router = express.Router();

    // 1. POST /api/back-in-stock-requests - Public customer submission (Rate-limited, no auth required)
    router.post('/', backInStockRateLimiter, validateCreateBackInStockRequest, (req, res, next) => {
        backInStockRequestController.createRequest(req, res, next);
    });

    // Dashboard Back-in-Stock Request Management APIs - Protected for ADMIN and STAFF roles
    const protectedMiddleware = [
        authMiddleware.authenticate,
        authMiddleware.requireStaffOrAdmin
    ];

    // 2. GET /api/back-in-stock-requests/grouped - List requests grouped by phone
    router.get('/grouped', ...protectedMiddleware, validateListBackInStockRequests, (req, res, next) => {
        backInStockRequestController.listRequestsGroupedByPhone(req, res, next);
    });

    router.get('/grouped-by-phone', ...protectedMiddleware, validateListBackInStockRequests, (req, res, next) => {
        backInStockRequestController.listRequestsGroupedByPhone(req, res, next);
    });

    router.get('/phones', ...protectedMiddleware, validateListBackInStockRequests, (req, res, next) => {
        backInStockRequestController.listRequestsGroupedByPhone(req, res, next);
    });

    // 3. GET /api/back-in-stock-requests/phones/:phoneId - Retrieve waiting customers for a selected phone
    router.get('/phones/:phoneId', ...protectedMiddleware, validatePhoneIdParam, (req, res, next) => {
        backInStockRequestController.getWaitingCustomersForPhone(req, res, next);
    });

    router.get('/phone/:phoneId', ...protectedMiddleware, validatePhoneIdParam, (req, res, next) => {
        backInStockRequestController.getWaitingCustomersForPhone(req, res, next);
    });

    // 4. GET /api/back-in-stock-requests - List requests with pagination, searching, and filtering
    router.get('/', ...protectedMiddleware, validateListBackInStockRequests, (req, res, next) => {
        backInStockRequestController.listRequests(req, res, next);
    });

    // 5. GET /api/back-in-stock-requests/:id - Retrieve complete details of an individual request
    router.get('/:id', ...protectedMiddleware, validateBackInStockRequestIdParam, (req, res, next) => {
        backInStockRequestController.getRequestById(req, res, next);
    });

    // 6. PATCH /api/back-in-stock-requests/:id/status - Mark an individual request as Contacted
    router.patch('/:id/status', ...protectedMiddleware, validateBackInStockRequestIdParam, validateUpdateBackInStockRequestStatus, (req, res, next) => {
        backInStockRequestController.updateRequestStatus(req, res, next);
    });

    // 7. PATCH /api/back-in-stock-requests/:id - Alias endpoint for marking Contacted
    router.patch('/:id', ...protectedMiddleware, validateBackInStockRequestIdParam, validateUpdateBackInStockRequestStatus, (req, res, next) => {
        backInStockRequestController.updateRequestStatus(req, res, next);
    });

    router.post('/:id/contacted', ...protectedMiddleware, validateBackInStockRequestIdParam, validateUpdateBackInStockRequestStatus, (req, res, next) => {
        backInStockRequestController.updateRequestStatus(req, res, next);
    });

    // 8. PATCH /api/back-in-stock-requests/:id/assign - Assign request to a staff member
    router.patch('/:id/assign', ...protectedMiddleware, validateBackInStockRequestIdParam, validateAssignBackInStockRequest, (req, res, next) => {
        backInStockRequestController.assignRequest(req, res, next);
    });

    return router;
}

const defaultRouter = createBackInStockRequestRouter();

module.exports = defaultRouter;
module.exports.createBackInStockRequestRouter = createBackInStockRequestRouter;
