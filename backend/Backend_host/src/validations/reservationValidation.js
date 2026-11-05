const AppError = require('../utils/customError');

const POSITIVE_INT_REGEX = /^[1-9]\d*$/;
const PHONE_NUMBER_REGEX = /^\+?[0-9\s\-()]{7,25}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const VALID_RESERVATION_STATUSES = [
    'Pending',
    'Confirmed',
    'Ready for Collection',
    'Collected',
    'Cancelled',
    'Expired'
];

/**
 * Validates path parameter :id to ensure it is a positive integer
 */
function validateReservationIdParam(req, res, next) {
    const { id } = req.params;
    if (!id || !POSITIVE_INT_REGEX.test(String(id).trim())) {
        return next(new AppError('Invalid reservation ID parameter. Must be a positive integer.', 400));
    }
    next();
}

/**
 * Validates whether a date string is a real calendar date and not in the past
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCalendarDateNotPast(dateStr) {
    if (!DATE_REGEX.test(dateStr)) {
        return { valid: false, error: 'preferred_collection_date must be in YYYY-MM-DD format.' };
    }

    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (month < 1 || month > 12) {
        return { valid: false, error: 'preferred_collection_date has an invalid month.' };
    }

    const dateObj = new Date(year, month - 1, day);
    if (
        dateObj.getFullYear() !== year ||
        dateObj.getMonth() !== month - 1 ||
        dateObj.getDate() !== day
    ) {
        return { valid: false, error: 'preferred_collection_date is not a valid calendar date.' };
    }

    // Check that date is not in the past (using beginning of current day in local server time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj < today) {
        return { valid: false, error: 'preferred_collection_date cannot be in the past.' };
    }

    return { valid: true };
}

/**
 * Validates request payload for public reservation submission (C-09, C-03)
 */
function validateCreateReservation(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const {
        customer_name,
        phone_number,
        email,
        phone_id,
        selected_options,
        preferred_collection_date,
        customer_note,
        note
    } = req.body;

    // 1. Customer Name (Required)
    if (customer_name === undefined || customer_name === null || typeof customer_name !== 'string' || customer_name.trim().length === 0) {
        return next(new AppError('Customer name is required and cannot be empty.', 400));
    }
    const cleanCustomerName = customer_name.trim();
    if (cleanCustomerName.length < 2 || cleanCustomerName.length > 150) {
        return next(new AppError('Customer name must be between 2 and 150 characters.', 400));
    }

    // 2. Phone Number (Required)
    if (phone_number === undefined || phone_number === null || typeof phone_number !== 'string' || phone_number.trim().length === 0) {
        return next(new AppError('Phone number is required and cannot be empty.', 400));
    }
    const cleanPhone = phone_number.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (!PHONE_NUMBER_REGEX.test(cleanPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
        return next(new AppError('Invalid phone number format. Please provide a valid phone number containing 7 to 15 digits.', 400));
    }

    // 3. Email (Optional)
    let cleanEmail = null;
    if (email !== undefined && email !== null && String(email).trim() !== '') {
        const emailStr = String(email).trim();
        if (emailStr.length > 255 || !EMAIL_REGEX.test(emailStr)) {
            return next(new AppError('Invalid email address format.', 400));
        }
        cleanEmail = emailStr.toLowerCase();
    }

    // 4. Selected Phone ID (Required)
    if (phone_id === undefined || phone_id === null || String(phone_id).trim() === '') {
        return next(new AppError('Selected phone ID is required.', 400));
    }
    const phoneIdStr = String(phone_id).trim();
    if (!POSITIVE_INT_REGEX.test(phoneIdStr)) {
        return next(new AppError('Invalid phone_id. Must be a positive integer.', 400));
    }
    const cleanPhoneId = Number(phoneIdStr);

    // 5. Selected Phone Options (Optional / Validated against phone in service layer)
    let cleanOptions = null;
    if (selected_options !== undefined && selected_options !== null) {
        if (typeof selected_options !== 'object' || Array.isArray(selected_options)) {
            return next(new AppError('selected_options must be an object containing selected phone options.', 400));
        }

        cleanOptions = {};
        if (selected_options.storage_id !== undefined && selected_options.storage_id !== null) {
            const storageIdStr = String(selected_options.storage_id).trim();
            if (!POSITIVE_INT_REGEX.test(storageIdStr)) {
                return next(new AppError('selected_options.storage_id must be a positive integer.', 400));
            }
            cleanOptions.storage_id = Number(storageIdStr);
        }

        const rawColour = selected_options.colour !== undefined ? selected_options.colour : selected_options.color;
        if (rawColour !== undefined && rawColour !== null && String(rawColour).trim() !== '') {
            const colourStr = String(rawColour).trim();
            if (colourStr.length > 50) {
                return next(new AppError('selected_options.colour cannot exceed 50 characters.', 400));
            }
            cleanOptions.colour = colourStr;
        }

        if (Object.keys(cleanOptions).length === 0) {
            cleanOptions = null;
        }
    }

    // 6. Preferred Collection Date (Required, must not be in past)
    if (
        preferred_collection_date === undefined ||
        preferred_collection_date === null ||
        typeof preferred_collection_date !== 'string' ||
        preferred_collection_date.trim().length === 0
    ) {
        return next(new AppError('Preferred collection date is required.', 400));
    }
    const cleanDate = preferred_collection_date.trim();
    const dateValidation = validateCalendarDateNotPast(cleanDate);
    if (!dateValidation.valid) {
        return next(new AppError(dateValidation.error, 400));
    }

    // 7. Customer Note (Optional)
    const rawNote = customer_note !== undefined ? customer_note : note;
    let cleanNote = null;
    if (rawNote !== undefined && rawNote !== null && String(rawNote).trim() !== '') {
        const noteStr = String(rawNote).trim();
        if (noteStr.length > 2000) {
            return next(new AppError('Customer note cannot exceed 2000 characters.', 400));
        }
        cleanNote = noteStr;
    }

    // Mass-assignment protection: explicitly construct the validated payload
    req.body = {
        customer_name: cleanCustomerName,
        phone_number: cleanPhone,
        email: cleanEmail,
        phone_id: cleanPhoneId,
        selected_options: cleanOptions,
        preferred_collection_date: cleanDate,
        customer_note: cleanNote
    };

    next();
}

/**
 * Validates query parameters for GET /api/reservations (ST-07)
 */
function validateListReservations(req, res, next) {
    const {
        page,
        limit,
        search,
        status,
        phone_id,
        assigned_to,
        assigned_to_user_id,
        from_date,
        to_date
    } = req.query;

    if (page !== undefined) {
        if (!POSITIVE_INT_REGEX.test(String(page).trim())) {
            return next(new AppError('Page parameter must be a positive integer.', 400));
        }
    }

    if (limit !== undefined) {
        const parsedLimit = Number(limit);
        if (!POSITIVE_INT_REGEX.test(String(limit).trim()) || parsedLimit > 100) {
            return next(new AppError('Limit parameter must be an integer between 1 and 100.', 400));
        }
    }

    if (search !== undefined && typeof search === 'string') {
        const cleanSearch = search.trim();
        if (cleanSearch.length > 100) {
            return next(new AppError('Search query cannot exceed 100 characters.', 400));
        }
        req.query.search = cleanSearch;
    }

    if (status !== undefined && String(status).trim().length > 0) {
        const cleanStatus = String(status).trim().toLowerCase();
        const matched = VALID_RESERVATION_STATUSES.find((s) => s.toLowerCase() === cleanStatus);
        if (!matched) {
            return next(
                new AppError(
                    `Invalid status filter. Allowed values: ${VALID_RESERVATION_STATUSES.map((s) => `'${s}'`).join(', ')}.`,
                    400
                )
            );
        }
        req.query.status = matched;
    }

    if (phone_id !== undefined && String(phone_id).trim().length > 0) {
        if (!POSITIVE_INT_REGEX.test(String(phone_id).trim())) {
            return next(new AppError('phone_id parameter must be a positive integer.', 400));
        }
        req.query.phone_id = Number(phone_id);
    }

    const assignedParam = assigned_to_user_id !== undefined ? assigned_to_user_id : assigned_to;
    if (assignedParam !== undefined && String(assignedParam).trim().length > 0) {
        if (!POSITIVE_INT_REGEX.test(String(assignedParam).trim())) {
            return next(new AppError('Assigned staff filter must be a positive integer user ID.', 400));
        }
        req.query.assigned_to_user_id = Number(assignedParam);
    }

    if (from_date !== undefined && String(from_date).trim().length > 0) {
        if (!DATE_REGEX.test(String(from_date).trim())) {
            return next(new AppError('from_date parameter must be in YYYY-MM-DD format.', 400));
        }
        req.query.from_date = String(from_date).trim();
    }

    if (to_date !== undefined && String(to_date).trim().length > 0) {
        if (!DATE_REGEX.test(String(to_date).trim())) {
            return next(new AppError('to_date parameter must be in YYYY-MM-DD format.', 400));
        }
        req.query.to_date = String(to_date).trim();
    }

    next();
}

/**
 * Validates status update payload for PATCH /api/reservations/:id/status (ST-07)
 */
function validateUpdateReservationStatus(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { status, assigned_to_user_id, assigned_to } = req.body;

    if (!status || typeof status !== 'string' || status.trim().length === 0) {
        return next(
            new AppError(
                `Reservation status is required. Allowed values are: ${VALID_RESERVATION_STATUSES.map((s) => `'${s}'`).join(', ')}.`,
                400
            )
        );
    }

    const matched = VALID_RESERVATION_STATUSES.find((s) => s.toLowerCase() === status.trim().toLowerCase());
    if (!matched) {
        return next(
            new AppError(
                `Invalid reservation status. Allowed values are: ${VALID_RESERVATION_STATUSES.map((s) => `'${s}'`).join(', ')}.`,
                400
            )
        );
    }

    let cleanAssignedTo = undefined;
    const assignedValue = assigned_to_user_id !== undefined ? assigned_to_user_id : assigned_to;
    if (assignedValue !== undefined) {
        if (assignedValue === null || String(assignedValue).trim() === '') {
            cleanAssignedTo = null;
        } else if (!POSITIVE_INT_REGEX.test(String(assignedValue).trim())) {
            return next(new AppError('assigned_to_user_id must be a positive integer or null.', 400));
        } else {
            cleanAssignedTo = Number(assignedValue);
        }
    }

    req.body = {
        status: matched,
        ...(cleanAssignedTo !== undefined ? { assigned_to_user_id: cleanAssignedTo } : {})
    };

    next();
}

/**
 * Validates staff assignment payload for PATCH /api/reservations/:id/assign
 */
function validateAssignReservation(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
        return next(new AppError('Request body is missing. Please send JSON data.', 400));
    }

    const { assigned_to_user_id, assigned_to } = req.body;
    const assignedValue = assigned_to_user_id !== undefined ? assigned_to_user_id : assigned_to;

    let cleanAssignedTo = null;
    if (assignedValue !== undefined && assignedValue !== null && String(assignedValue).trim() !== '') {
        if (!POSITIVE_INT_REGEX.test(String(assignedValue).trim())) {
            return next(new AppError('assigned_to_user_id must be a positive integer or null.', 400));
        }
        cleanAssignedTo = Number(assignedValue);
    }

    req.body = {
        assigned_to_user_id: cleanAssignedTo
    };

    next();
}

module.exports = {
    VALID_RESERVATION_STATUSES,
    validateReservationIdParam,
    validateCalendarDateNotPast,
    validateCreateReservation,
    validateListReservations,
    validateUpdateReservationStatus,
    validateAssignReservation
};
