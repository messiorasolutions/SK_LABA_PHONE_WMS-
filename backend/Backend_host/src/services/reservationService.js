const defaultReservationRepository = require('../repositories/reservationRepository');
const defaultPhoneRepository = require('../repositories/phoneRepository');
const defaultUserRepository = require('../repositories/dashboardUserRepository');
const { VALID_RESERVATION_STATUSES } = require('../validations/reservationValidation');
const AppError = require('../utils/customError');

class ReservationService {
    constructor({
        reservationRepository = defaultReservationRepository,
        phoneRepository = defaultPhoneRepository,
        userRepository = defaultUserRepository
    } = {}) {
        this.reservationRepository = reservationRepository;
        this.phoneRepository = phoneRepository;
        this.userRepository = userRepository;
    }

    /**
     * Submit a public customer reservation request (C-09, C-03)
     * Inventory stock is NOT modified.
     */
    async createReservation({
        customer_name,
        phone_number,
        email = null,
        phone_id,
        selected_options = null,
        preferred_collection_date,
        customer_note = null
    }) {
        // 1. Look up phone
        const phone = await this.phoneRepository.findById(phone_id);
        if (!phone) {
            throw new AppError('Referenced phone does not exist.', 404);
        }

        // 2. Enforce Phone Status and Availability (C-03)
        if (phone.status !== 'PUBLISHED') {
            throw new AppError('The selected phone is currently not available for reservation.', 400);
        }

        // Canonical database schema field is `current_stock`.
        // Explicit fallback to `stock_quantity` is provided for schema variants or test fixtures.
        const rawStock = phone.current_stock !== undefined ? phone.current_stock : phone.stock_quantity;
        const numericStock = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock))
            ? Number(rawStock)
            : null;

        // Reject if marked SOLD_OUT, or stock data is missing/invalid, or stock is zero or less
        if (
            phone.availability === 'SOLD_OUT' ||
            numericStock === null ||
            numericStock <= 0
        ) {
            throw new AppError('The selected phone is sold out and cannot be reserved.', 400);
        }

        if (phone.availability === 'COMING_SOON') {
            throw new AppError('The selected phone is not yet available for reservation.', 400);
        }

        // 3. Validate selected phone options against phone's configured options
        if (selected_options && typeof selected_options === 'object') {
            // Storage option validation
            if (selected_options.storage_id !== undefined && selected_options.storage_id !== null) {
                const requestedStorageId = Number(selected_options.storage_id);
                const phoneStorageIds = Array.isArray(phone.storage_ids)
                    ? phone.storage_ids.map(Number)
                    : [];

                if (phoneStorageIds.length === 0) {
                    throw new AppError('The selected phone does not have storage options available.', 400);
                }

                if (!phoneStorageIds.includes(requestedStorageId)) {
                    throw new AppError('Selected storage option is not available for this phone.', 400);
                }
            }

            // Colour option validation
            if (selected_options.colour !== undefined && selected_options.colour !== null && String(selected_options.colour).trim() !== '') {
                const requestedColour = String(selected_options.colour).trim().toLowerCase();
                const phoneColours = Array.isArray(phone.colour_options)
                    ? phone.colour_options
                    : [];

                if (phoneColours.length === 0) {
                    throw new AppError('The selected phone does not have colour options available.', 400);
                }

                const matchesColour = phoneColours.some((col) => {
                    if (typeof col === 'string') {
                        return col.trim().toLowerCase() === requestedColour;
                    }
                    if (col && typeof col === 'object' && col.name) {
                        return String(col.name).trim().toLowerCase() === requestedColour;
                    }
                    return false;
                });

                if (!matchesColour) {
                    throw new AppError('Selected colour option is not available for this phone.', 400);
                }
            }
        }

        // 4. Create reservation - Stock is explicitly NOT changed
        const reservation = await this.reservationRepository.create({
            customer_name,
            phone_number,
            email,
            phone_id,
            selected_options,
            preferred_collection_date,
            customer_note
        });

        return reservation;
    }

    /**
     * List reservations with pagination, searching, and filtering (ST-07)
     */
    async listReservations(options = {}) {
        return await this.reservationRepository.findReservations(options);
    }

    /**
     * Retrieve complete details of an individual reservation by ID (ST-07)
     */
    async getReservationById(reservationId) {
        const reservation = await this.reservationRepository.findById(reservationId);
        if (!reservation) {
            throw new AppError('Reservation not found.', 404);
        }
        return reservation;
    }

    /**
     * Update reservation status and staff audit attribution (ST-07)
     * Inventory stock is NOT modified.
     */
    async updateReservationStatus(reservationId, { status, assigned_to_user_id }, authenticatedUserId) {
        if (!authenticatedUserId) {
            throw new AppError('Unauthorized: Authenticated staff member identity is required.', 401);
        }

        const existing = await this.reservationRepository.findById(reservationId);
        if (!existing) {
            throw new AppError('Reservation not found.', 404);
        }

        // Validate status matches one of the 6 exact values
        if (!VALID_RESERVATION_STATUSES.includes(status)) {
            throw new AppError(
                `Invalid reservation status. Allowed values are: ${VALID_RESERVATION_STATUSES.map((s) => `'${s}'`).join(', ')}.`,
                400
            );
        }

        // If assigning/reassigning staff, verify staff member
        if (assigned_to_user_id !== undefined && assigned_to_user_id !== null) {
            const staff = await this.userRepository.findById(assigned_to_user_id);
            if (!staff) {
                throw new AppError('Assigned staff member does not exist.', 404);
            }
            if (!staff.is_active) {
                throw new AppError('Cannot assign reservation to an inactive staff member.', 400);
            }
        }

        const updated = await this.reservationRepository.updateStatus(
            reservationId,
            {
                status,
                updated_by_user_id: authenticatedUserId,
                assigned_to_user_id
            }
        );

        return updated;
    }

    /**
     * Assign or reassign reservation to a staff member (ST-07)
     */
    async assignReservation(reservationId, assigned_to_user_id, authenticatedUserId) {
        if (!authenticatedUserId) {
            throw new AppError('Unauthorized: Authenticated staff member identity is required.', 401);
        }

        const existing = await this.reservationRepository.findById(reservationId);
        if (!existing) {
            throw new AppError('Reservation not found.', 404);
        }

        if (assigned_to_user_id !== null && assigned_to_user_id !== undefined) {
            const staff = await this.userRepository.findById(assigned_to_user_id);
            if (!staff) {
                throw new AppError('Assigned staff member does not exist.', 404);
            }
            if (!staff.is_active) {
                throw new AppError('Cannot assign reservation to an inactive staff member.', 400);
            }
        }

        const updated = await this.reservationRepository.updateAssignment(
            reservationId,
            {
                assigned_to_user_id,
                updated_by_user_id: authenticatedUserId
            }
        );

        return updated;
    }
}

const defaultReservationService = new ReservationService();

module.exports = defaultReservationService;
module.exports.ReservationService = ReservationService;
