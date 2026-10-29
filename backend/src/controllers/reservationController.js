const defaultReservationService = require('../services/reservationService');

class ReservationController {
    constructor(reservationService = defaultReservationService) {
        this.reservationService = reservationService;
    }

    /**
     * POST /api/reservations
     * Public customer reservation submission (C-09, C-03)
     */
    async createReservation(req, res, next) {
        try {
            const {
                customer_name,
                phone_number,
                email,
                phone_id,
                selected_options,
                preferred_collection_date,
                customer_note
            } = req.body;

            const reservation = await this.reservationService.createReservation({
                customer_name,
                phone_number,
                email,
                phone_id,
                selected_options,
                preferred_collection_date,
                customer_note
            });

            return res.status(201).json({
                success: true,
                message: 'Your request is received. The shop will confirm.',
                data: reservation
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reservations
     * Protected dashboard endpoint: list reservations with pagination, searching, and filtering (ST-07)
     */
    async listReservations(req, res, next) {
        try {
            const {
                page,
                limit,
                search,
                status,
                phone_id,
                assigned_to_user_id,
                from_date,
                to_date
            } = req.query;

            const result = await this.reservationService.listReservations({
                page,
                limit,
                search,
                status,
                phone_id,
                assigned_to_user_id,
                from_date,
                to_date
            });

            return res.status(200).json({
                success: true,
                data: result.reservations,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reservations/:id
     * Protected dashboard endpoint: retrieve complete reservation details (ST-07)
     */
    async getReservationById(req, res, next) {
        try {
            const { id } = req.params;
            const reservation = await this.reservationService.getReservationById(id);

            return res.status(200).json({
                success: true,
                data: reservation
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/reservations/:id/status
     * Protected dashboard endpoint: update reservation status (ST-07)
     */
    async updateReservationStatus(req, res, next) {
        try {
            const { id } = req.params;
            // Staff ID is strictly obtained from authenticated session
            const staffUserId = req.user ? req.user.user_id : null;

            const updated = await this.reservationService.updateReservationStatus(
                id,
                req.body,
                staffUserId
            );

            return res.status(200).json({
                success: true,
                message: 'Reservation status updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/reservations/:id/assign
     * Protected dashboard endpoint: assign or reassign reservation to staff
     */
    async assignReservation(req, res, next) {
        try {
            const { id } = req.params;
            const staffUserId = req.user ? req.user.user_id : null;

            const updated = await this.reservationService.assignReservation(
                id,
                req.body.assigned_to_user_id,
                staffUserId
            );

            return res.status(200).json({
                success: true,
                message: 'Reservation assigned successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }
}

const defaultReservationController = new ReservationController();

module.exports = defaultReservationController;
module.exports.ReservationController = ReservationController;
