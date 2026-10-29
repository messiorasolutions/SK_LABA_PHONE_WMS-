const AppError = require('../utils/customError');

const POSITIVE_INT_REGEX = /^[1-9]\d*$/;
const PHONE_NUMBER_REGEX = /^\+?[0-9\s\-()]{7,25}$/;
const VALID_STATUSES = ['New', 'In Progress', 'Contacted', 'Closed'];

/**
 * Validates path parameter :id to ensure it is a positive integer
 */
function validateInquiryIdParam(req, res, next) {
    const { id } = req.params;
    if (!id || !POSITIVE_INT_REGEX.test(String(id).trim())) {
        return next(new AppError('Invalid inquiry ID parameter. Must be a positive integer.', 400));
    }
    next();
}

/**
 * Validates request payload for public inquiry submission
 */
function validateCreateInquiry(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { name, phone_number, message, phone_id } = req.body;

    // 1. Validate customer name
    if (name === undefined || name === null || typeof name !== 'string' || name.trim().length === 0) {
        return next(new AppError('Customer name is required and cannot be empty.', 400));
    }
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 150) {
        return next(new AppError('Customer name must be between 2 and 150 characters.', 400));
    }

    // 2. Validate phone number
    if (phone_number === undefined || phone_number === null || typeof phone_number !== 'string' || phone_number.trim().length === 0) {
        return next(new AppError('Phone number is required and cannot be empty.', 400));
    }
    const cleanPhone = phone_number.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (!PHONE_NUMBER_REGEX.test(cleanPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
        return next(new AppError('Invalid phone number format. Please provide a valid phone number containing 7 to 15 digits.', 400));
    }

    // 3. Validate message
    if (message === undefined || message === null || typeof message !== 'string' || message.trim().length === 0) {
        return next(new AppError('Inquiry message is required and cannot be empty.', 400));
    }
    const cleanMessage = message.trim();
    if (cleanMessage.length < 5 || cleanMessage.length > 3000) {
        return next(new AppError('Inquiry message must be between 5 and 3000 characters.', 400));
    }

    // 4. Validate optional phone_id
    let cleanPhoneId = null;
    if (phone_id !== undefined && phone_id !== null && String(phone_id).trim() !== '') {
        const phoneIdStr = String(phone_id).trim();
        if (!POSITIVE_INT_REGEX.test(phoneIdStr)) {
            return next(new AppError('Invalid phone_id. Must be a positive integer when provided.', 400));
        }
        cleanPhoneId = Number(phoneIdStr);
    }

    // Sanitize and normalize request body
    req.body = {
        name: cleanName,
        phone_number: cleanPhone,
        message: cleanMessage,
        phone_id: cleanPhoneId
    };

    next();
}

/**
 * Validates query parameters for GET /api/inquiries
 */
function validateListInquiries(req, res, next) {
    const { page, limit, search, status, assigned_to, assigned_to_user_id } = req.query;

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
        const matched = VALID_STATUSES.find((s) => s.toLowerCase() === cleanStatus);
        if (!matched) {
            return next(new AppError("Invalid status filter. Allowed values: 'New', 'In Progress', 'Contacted', 'Closed'.", 400));
        }
        req.query.status = matched;
    }

    const assignedParam = assigned_to_user_id !== undefined ? assigned_to_user_id : assigned_to;
    if (assignedParam !== undefined && String(assignedParam).trim().length > 0) {
        if (!POSITIVE_INT_REGEX.test(String(assignedParam).trim())) {
            return next(new AppError('Assigned staff filter must be a positive integer user ID.', 400));
        }
        req.query.assigned_to_user_id = Number(assignedParam);
    }

    next();
}

/**
 * Validates status update payload for PATCH /api/inquiries/:id/status
 */
function validateUpdateInquiryStatus(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { status, assigned_to_user_id, assigned_to } = req.body;

    if (!status || typeof status !== 'string' || status.trim().length === 0) {
        return next(new AppError("Inquiry status is required. Allowed values are: 'New', 'In Progress', 'Contacted', 'Closed'.", 400));
    }

    const matched = VALID_STATUSES.find((s) => s.toLowerCase() === status.trim().toLowerCase());
    if (!matched) {
        return next(new AppError("Invalid inquiry status. Allowed values are: 'New', 'In Progress', 'Contacted', 'Closed'.", 400));
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

module.exports = {
    VALID_STATUSES,
    validateInquiryIdParam,
    validateCreateInquiry,
    validateListInquiries,
    validateUpdateInquiryStatus
};
