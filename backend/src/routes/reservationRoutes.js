const express = require('express');
const defaultReservationController = require('../controllers/reservationController');
const defaultAuthMiddleware = require('../middleware/authMiddleware');
const { reservationRateLimiter: defaultReservationRateLimiter } = require('../middleware/rateLimiter');
const {
    validateReservationIdParam,
    validateCreateReservation,
    validateListReservations,
    validateUpdateReservationStatus,
    validateAssignReservation
} = require('../validations/reservationValidation');

function createReservationsRouter({
    reservationController = defaultReservationController,
    authMiddleware = defaultAuthMiddleware,
    reservationRateLimiter = defaultReservationRateLimiter
} = {}) {
    const router = express.Router();

    // 1. POST /api/reservations - Public customer reservation submission (C-09, C-03)
    // Rate-limited, no dashboard authentication required
    router.post('/', reservationRateLimiter, validateCreateReservation, (req, res, next) => {
        reservationController.createReservation(req, res, next);
    });

    // Dashboard Reservation Management APIs - Protected for ADMIN and STAFF roles (ST-07)
    const protectedMiddleware = [
        authMiddleware.authenticate,
        authMiddleware.requireStaffOrAdmin
    ];

    // 2. GET /api/reservations - List reservations with pagination, searching, and filtering
    router.get('/', ...protectedMiddleware, validateListReservations, (req, res, next) => {
        reservationController.listReservations(req, res, next);
    });

    // 3. GET /api/reservations/:id - Retrieve complete details of an individual reservation
    router.get('/:id', ...protectedMiddleware, validateReservationIdParam, (req, res, next) => {
        reservationController.getReservationById(req, res, next);
    });

    // 4. PATCH /api/reservations/:id/status - Update reservation status and staff attribution
    router.patch('/:id/status', ...protectedMiddleware, validateReservationIdParam, validateUpdateReservationStatus, (req, res, next) => {
        reservationController.updateReservationStatus(req, res, next);
    });

    // 5. PATCH /api/reservations/:id - Alias endpoint for updating status
    router.patch('/:id', ...protectedMiddleware, validateReservationIdParam, validateUpdateReservationStatus, (req, res, next) => {
        reservationController.updateReservationStatus(req, res, next);
    });

    // 6. PATCH /api/reservations/:id/assign - Assign or reassign reservation to staff
    router.patch('/:id/assign', ...protectedMiddleware, validateReservationIdParam, validateAssignReservation, (req, res, next) => {
        reservationController.assignReservation(req, res, next);
    });

    return router;
}

const defaultRouter = createReservationsRouter();

module.exports = defaultRouter;
module.exports.createReservationsRouter = createReservationsRouter;
