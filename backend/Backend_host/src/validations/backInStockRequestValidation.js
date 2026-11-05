const AppError = require('../utils/customError');

const POSITIVE_INT_REGEX = /^[1-9]\d*$/;
const PHONE_NUMBER_REGEX = /^\+?[0-9\s\-()]{7,25}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = ['Pending', 'Contacted'];

/**
 * Validates path parameter :id to ensure it is a positive integer
 */
function validateBackInStockRequestIdParam(req, res, next) {
    const { id } = req.params;
    if (!id || !POSITIVE_INT_REGEX.test(String(id).trim())) {
        return next(new AppError('Invalid back-in-stock request ID parameter. Must be a positive integer.', 400));
    }
    next();
}

/**
 * Validates path parameter :phoneId to ensure it is a positive integer
 */
function validatePhoneIdParam(req, res, next) {
    const id = req.params.phoneId || req.params.id;
    if (!id || !POSITIVE_INT_REGEX.test(String(id).trim())) {
        return next(new AppError('Invalid phone ID parameter. Must be a positive integer.', 400));
    }
    next();
}

/**
 * Validates request payload for public customer back-in-stock notification submission
 */
function validateCreateBackInStockRequest(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const {
        phone_id,
        customer_name,
        name,
        phone_number,
        whatsapp_number,
        contact_number,
        email,
        customer_email,
        notes
    } = req.body;

    // 1. Phone ID (Required positive integer)
    if (phone_id === undefined || phone_id === null || String(phone_id).trim() === '') {
        return next(new AppError('phone_id is required.', 400));
    }
    const cleanPhoneIdStr = String(phone_id).trim();
    if (!POSITIVE_INT_REGEX.test(cleanPhoneIdStr)) {
        return next(new AppError('Invalid phone_id. Must be a positive integer.', 400));
    }
    const cleanPhoneId = Number(cleanPhoneIdStr);

    // 2. Customer Name (Required, between 2 and 150 characters)
    const rawName = customer_name !== undefined ? customer_name : name;
    if (rawName === undefined || rawName === null || typeof rawName !== 'string' || rawName.trim().length === 0) {
        return next(new AppError('Customer name is required and cannot be empty.', 400));
    }
    const cleanName = rawName.trim();
    if (cleanName.length < 2 || cleanName.length > 150) {
        return next(new AppError('Customer name must be between 2 and 150 characters.', 400));
    }

    // 3. Phone / WhatsApp Number (Required, 7 to 15 digits)
    const rawPhone = phone_number !== undefined
        ? phone_number
        : (whatsapp_number !== undefined ? whatsapp_number : contact_number);

    if (rawPhone === undefined || rawPhone === null || typeof rawPhone !== 'string' || rawPhone.trim().length === 0) {
        return next(new AppError('Phone number or WhatsApp number is required and cannot be empty.', 400));
    }
    const cleanPhone = rawPhone.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (!PHONE_NUMBER_REGEX.test(cleanPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
        return next(new AppError('Invalid phone number format. Please provide a valid phone or WhatsApp number containing 7 to 15 digits.', 400));
    }

    // 4. Email (Optional, valid format and max 255 chars)
    const rawEmail = email !== undefined ? email : customer_email;
    let cleanEmail = null;
    if (rawEmail !== undefined && rawEmail !== null && String(rawEmail).trim().length > 0) {
        const emailStr = String(rawEmail).trim();
        if (emailStr.length > 255 || !EMAIL_REGEX.test(emailStr)) {
            return next(new AppError('Invalid email address format.', 400));
        }
        cleanEmail = emailStr.toLowerCase();
    }

    // 5. Notes (Optional, max 1000 chars)
    let cleanNotes = null;
    if (notes !== undefined && notes !== null && typeof notes === 'string' && notes.trim().length > 0) {
        cleanNotes = notes.trim().slice(0, 1000);
    }

    // Strictly sanitize and normalize request body to prevent mass-assignment
    req.body = {
        phone_id: cleanPhoneId,
        customer_name: cleanName,
        phone_number: cleanPhone,
        email: cleanEmail,
        notes: cleanNotes
    };

    next();
}

/**
 * Validates query parameters for listing back-in-stock requests
 */
function validateListBackInStockRequests(req, res, next) {
    const { page, limit, search, status, phone_id, assigned_to_user_id } = req.query;

    if (page !== undefined && (!POSITIVE_INT_REGEX.test(String(page).trim()) || parseInt(page, 10) < 1)) {
        return next(new AppError('Invalid page parameter. Must be a positive integer greater than or equal to 1.', 400));
    }

    if (limit !== undefined && (!POSITIVE_INT_REGEX.test(String(limit).trim()) || parseInt(limit, 10) < 1 || parseInt(limit, 10) > 100)) {
        return next(new AppError('Invalid limit parameter. Must be a positive integer between 1 and 100.', 400));
    }

    if (phone_id !== undefined && String(phone_id).trim() !== '') {
        if (!POSITIVE_INT_REGEX.test(String(phone_id).trim())) {
            return next(new AppError('Invalid phone_id query parameter. Must be a positive integer.', 400));
        }
    }

    if (assigned_to_user_id !== undefined && String(assigned_to_user_id).trim() !== '') {
        if (!POSITIVE_INT_REGEX.test(String(assigned_to_user_id).trim())) {
            return next(new AppError('Invalid assigned_to_user_id query parameter. Must be a positive integer.', 400));
        }
    }

    if (status !== undefined && typeof status === 'string' && status.trim().length > 0) {
        const cleanStatus = status.trim().toLowerCase();
        const matched = VALID_STATUSES.find(s => s.toLowerCase() === cleanStatus);
        if (!matched) {
            return next(new AppError(`Invalid status filter. Allowed values are: ${VALID_STATUSES.join(', ')}.`, 400));
        }
        req.query.status = matched;
    }

    next();
}

/**
 * Validates status update for dashboard staff
 * Must mark as 'Contacted'
 */
function validateUpdateBackInStockRequestStatus(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
        req.body = {};
    }

    const { status, notes } = req.body;

    // If status is passed or defaulted
    let cleanStatus = 'Contacted';
    if (status !== undefined && status !== null && String(status).trim() !== '') {
        const rawStatus = String(status).trim().toLowerCase();
        const matched = VALID_STATUSES.find(s => s.toLowerCase() === rawStatus);
        if (!matched) {
            return next(new AppError(`Invalid status '${status}'. Back-in-stock requests only accept: ${VALID_STATUSES.join(', ')}.`, 400));
        }
        cleanStatus = matched;
    }

    let cleanNotes = null;
    if (notes !== undefined && notes !== null && typeof notes === 'string') {
        cleanNotes = notes.trim().slice(0, 1000);
    }

    req.body = {
        status: cleanStatus,
        notes: cleanNotes
    };

    next();
}

/**
 * Validates staff assignment payload
 */
function validateAssignBackInStockRequest(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
        return next(new AppError('Request body is missing or empty.', 400));
    }

    const { assigned_to_user_id } = req.body;
    if (assigned_to_user_id === undefined || assigned_to_user_id === null || !POSITIVE_INT_REGEX.test(String(assigned_to_user_id).trim())) {
        return next(new AppError('assigned_to_user_id is required and must be a positive integer.', 400));
    }

    req.body = {
        assigned_to_user_id: Number(assigned_to_user_id)
    };

    next();
}

module.exports = {
    validateBackInStockRequestIdParam,
    validatePhoneIdParam,
    validateCreateBackInStockRequest,
    validateListBackInStockRequests,
    validateUpdateBackInStockRequestStatus,
    validateAssignBackInStockRequest,
    VALID_STATUSES
};
