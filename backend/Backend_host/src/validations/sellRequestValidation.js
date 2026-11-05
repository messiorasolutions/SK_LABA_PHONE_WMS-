const AppError = require('../utils/customError');

const POSITIVE_INT_REGEX = /^[1-9]\d*$/;
const PHONE_NUMBER_REGEX = /^\+?[0-9\s\-()]{7,25}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const VALID_STATUSES = ['New', 'Quote Given', 'Accepted', 'Declined', 'Closed'];
const STATUS_MAP = new Map(VALID_STATUSES.map((s) => [s.toLowerCase(), s]));

/**
 * Validates path parameter :id to ensure it is a positive integer
 */
function validateSellRequestIdParam(req, res, next) {
    const { id } = req.params;
    if (!id || !POSITIVE_INT_REGEX.test(String(id).trim())) {
        return next(new AppError('Invalid sell request ID parameter. Must be a positive integer.', 400));
    }
    next();
}

/**
 * Validates request payload for public customer sell-your-phone submission 
 */
function validateCreateSellRequest(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty.', 400));
    }

    const {
        customer_name,
        name,
        phone_number,
        brand_and_model,
        brand,
        model,
        current_phone_brand_and_model,
        storage_capacity,
        storage,
        phone_condition,
        condition,
        battery_health,
        description,
        desired_phone_id,
        phone_id,
        target_phone_id,
        photos
    } = req.body;

    // 1. Customer Name (Required)
    const rawName = customer_name !== undefined ? customer_name : name;
    if (rawName === undefined || rawName === null || typeof rawName !== 'string' || rawName.trim().length === 0) {
        return next(new AppError('Customer name is required and cannot be empty.', 400));
    }
    const cleanCustomerName = rawName.trim();
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

    // 3. Current Phone Brand and Model (Required)
    let cleanBrand = null;
    let cleanModel = null;
    let cleanBrandAndModel = null;

    if (brand !== undefined && brand !== null && String(brand).trim().length > 0) {
        cleanBrand = String(brand).trim();
    }
    if (model !== undefined && model !== null && String(model).trim().length > 0) {
        cleanModel = String(model).trim();
    }

    const rawBrandAndModel = brand_and_model !== undefined ? brand_and_model : current_phone_brand_and_model;
    if (rawBrandAndModel !== undefined && rawBrandAndModel !== null && String(rawBrandAndModel).trim().length > 0) {
        cleanBrandAndModel = String(rawBrandAndModel).trim();
    } else if (cleanBrand && cleanModel) {
        cleanBrandAndModel = `${cleanBrand} ${cleanModel}`;
    }

    if (!cleanBrandAndModel) {
        return next(new AppError('Current phone brand and model is required.', 400));
    }
    if (cleanBrandAndModel.length < 2 || cleanBrandAndModel.length > 200) {
        return next(new AppError('Current phone brand and model must be between 2 and 200 characters.', 400));
    }

    // 4. Storage Capacity (Required)
    const rawStorage = storage_capacity !== undefined ? storage_capacity : storage;
    if (rawStorage === undefined || rawStorage === null || String(rawStorage).trim().length === 0) {
        return next(new AppError('Storage capacity is required.', 400));
    }
    const cleanStorage = String(rawStorage).trim();
    if (cleanStorage.length > 50) {
        return next(new AppError('Storage capacity cannot exceed 50 characters.', 400));
    }

    // 5. Phone Condition (Required)
    const rawCondition = phone_condition !== undefined ? phone_condition : condition;
    if (rawCondition === undefined || rawCondition === null || typeof rawCondition !== 'string' || rawCondition.trim().length === 0) {
        return next(new AppError('Phone condition is required.', 400));
    }
    const cleanCondition = rawCondition.trim();
    if (cleanCondition.length < 2 || cleanCondition.length > 50) {
        return next(new AppError('Phone condition must be between 2 and 50 characters.', 400));
    }

    // 6. Battery Health (Required)
    if (battery_health === undefined || battery_health === null || String(battery_health).trim().length === 0) {
        return next(new AppError('Battery health is required.', 400));
    }
    const cleanBatteryHealth = String(battery_health).trim();
    if (cleanBatteryHealth.length > 30) {
        return next(new AppError('Battery health cannot exceed 30 characters.', 400));
    }

    // 7. Description (Optional)
    let cleanDescription = null;
    if (description !== undefined && description !== null && String(description).trim().length > 0) {
        const descStr = String(description).trim();
        if (descStr.length > 3000) {
            return next(new AppError('Description cannot exceed 3000 characters.', 400));
        }
        cleanDescription = descStr;
    }

    // 8. Desired Phone ID (Optional)
    const rawDesiredPhone = desired_phone_id !== undefined ? desired_phone_id : (phone_id !== undefined ? phone_id : target_phone_id);
    let cleanDesiredPhoneId = null;
    if (rawDesiredPhone !== undefined && rawDesiredPhone !== null && String(rawDesiredPhone).trim() !== '') {
        const phoneIdStr = String(rawDesiredPhone).trim();
        if (!POSITIVE_INT_REGEX.test(phoneIdStr)) {
            return next(new AppError('Invalid desired phone ID. Must be a positive integer when provided.', 400));
        }
        cleanDesiredPhoneId = Number(phoneIdStr);
    }

    // 9. Photos (Optional, maximum 5 photos)
    let cleanPhotos = null;
    if (photos !== undefined && photos !== null) {
        // Enforce that client cannot submit arbitrary unvalidated URLs or strings directly in JSON
        if (!req.isServerValidatedUpload) {
            return next(new AppError('Photo files must be uploaded via multipart form submission. Client-provided arbitrary photo URLs or paths are not accepted.', 400));
        }
        if (!Array.isArray(photos)) {
            return next(new AppError('Photos must be an array of image storage keys.', 400));
        }
        if (photos.length > 5) {
            return next(new AppError('Maximum of 5 photos allowed.', 400));
        }
        cleanPhotos = photos;
    }

    // Sanitize request body to strict permitted fields (prevents mass-assignment)
    req.body = {
        customer_name: cleanCustomerName,
        phone_number: cleanPhone,
        brand_and_model: cleanBrandAndModel,
        brand: cleanBrand,
        model: cleanModel,
        storage_capacity: cleanStorage,
        phone_condition: cleanCondition,
        battery_health: cleanBatteryHealth,
        description: cleanDescription,
        desired_phone_id: cleanDesiredPhoneId,
        photos: cleanPhotos
    };

    next();
}

/**
 * Validates status update payload for dashboard request management 
 */
function validateUpdateSellRequestStatus(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty.', 400));
    }

    const { status, assigned_to_user_id } = req.body;

    if (status === undefined || status === null || typeof status !== 'string' || status.trim().length === 0) {
        return next(new AppError(`Status is required. Allowed values are: ${VALID_STATUSES.join(', ')}`, 400));
    }

    const normalizedStatus = STATUS_MAP.get(status.trim().toLowerCase());
    if (!normalizedStatus) {
        return next(new AppError(`Invalid status '${status}'. Allowed values are: ${VALID_STATUSES.join(', ')}`, 400));
    }

    let cleanAssignedToUserId = undefined;
    if (assigned_to_user_id !== undefined) {
        if (assigned_to_user_id === null || String(assigned_to_user_id).trim() === '') {
            cleanAssignedToUserId = null;
        } else {
            const assignStr = String(assigned_to_user_id).trim();
            if (!POSITIVE_INT_REGEX.test(assignStr)) {
                return next(new AppError('Invalid assigned_to_user_id parameter. Must be a positive integer or null.', 400));
            }
            cleanAssignedToUserId = Number(assignStr);
        }
    }

    req.body = {
        status: normalizedStatus,
        assigned_to_user_id: cleanAssignedToUserId
    };

    next();
}

/**
 * Validates staff assignment payload
 */
function validateAssignSellRequest(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
        return next(new AppError('Request body is missing or empty.', 400));
    }

    const { assigned_to_user_id } = req.body;

    if (assigned_to_user_id === undefined) {
        return next(new AppError('assigned_to_user_id is required.', 400));
    }

    let cleanAssignedToUserId = null;
    if (assigned_to_user_id !== null && String(assigned_to_user_id).trim() !== '') {
        const assignStr = String(assigned_to_user_id).trim();
        if (!POSITIVE_INT_REGEX.test(assignStr)) {
            return next(new AppError('Invalid assigned_to_user_id parameter. Must be a positive integer or null.', 400));
        }
        cleanAssignedToUserId = Number(assignStr);
    }

    req.body = {
        assigned_to_user_id: cleanAssignedToUserId
    };

    next();
}

/**
 * Validates query parameters for listing sell requests 
 */
function validateListSellRequests(req, res, next) {
    const { page, limit, search, status, assigned_to_user_id, desired_phone_id, from_date, to_date } = req.query;

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
    }

    if (status !== undefined && typeof status === 'string' && status.trim().length > 0) {
        const normalized = STATUS_MAP.get(status.trim().toLowerCase());
        if (!normalized) {
            return next(new AppError(`Invalid status filter '${status}'. Allowed values: ${VALID_STATUSES.join(', ')}`, 400));
        }
        req.query.status = normalized;
    }

    if (assigned_to_user_id !== undefined && String(assigned_to_user_id).trim() !== '') {
        if (!POSITIVE_INT_REGEX.test(String(assigned_to_user_id).trim())) {
            return next(new AppError('assigned_to_user_id filter must be a positive integer.', 400));
        }
    }

    if (desired_phone_id !== undefined && String(desired_phone_id).trim() !== '') {
        if (!POSITIVE_INT_REGEX.test(String(desired_phone_id).trim())) {
            return next(new AppError('desired_phone_id filter must be a positive integer.', 400));
        }
    }

    if (from_date !== undefined && String(from_date).trim() !== '') {
        const dateStr = String(from_date).trim();
        if (!DATE_REGEX.test(dateStr) || isNaN(Date.parse(dateStr))) {
            return next(new AppError('Invalid from_date format. Must be a valid date in YYYY-MM-DD format.', 400));
        }
    }

    if (to_date !== undefined && String(to_date).trim() !== '') {
        const dateStr = String(to_date).trim();
        if (!DATE_REGEX.test(dateStr) || isNaN(Date.parse(dateStr))) {
            return next(new AppError('Invalid to_date format. Must be a valid date in YYYY-MM-DD format.', 400));
        }
    }

    next();
}

module.exports = {
    validateSellRequestIdParam,
    validateCreateSellRequest,
    validateUpdateSellRequestStatus,
    validateAssignSellRequest,
    validateListSellRequests,
    VALID_STATUSES
};
