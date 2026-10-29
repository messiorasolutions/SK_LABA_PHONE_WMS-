const AppError = require('../utils/customError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSITIVE_INT_REGEX = /^[1-9]\d*$/;

/**
 * Validates path parameter :id to ensure it is a positive integer
 */
function validateUserIdParam(req, res, next) {
    const { id } = req.params;
    if (!id || !POSITIVE_INT_REGEX.test(String(id).trim())) {
        return next(new AppError('Invalid user ID parameter. Must be a positive integer.', 400));
    }
    next();
}

/**
 * Validates query parameters for GET /api/users
 */
function validateListUsers(req, res, next) {
    const { page, limit, search, role, is_active, status } = req.query;

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
        if (search.length > 100) {
            return next(new AppError('Search query cannot exceed 100 characters.', 400));
        }
    }

    if (role !== undefined) {
        const cleanRole = String(role).trim().toUpperCase();
        if (cleanRole !== 'ADMIN' && cleanRole !== 'STAFF') {
            return next(new AppError("Role filter must be either 'ADMIN' or 'STAFF'.", 400));
        }
        req.query.role = cleanRole;
    }

    // Support both ?is_active=true/false and ?status=active/inactive
    const activeParam = is_active !== undefined ? is_active : status;
    if (activeParam !== undefined) {
        const lower = String(activeParam).trim().toLowerCase();
        if (['true', '1', 'active'].includes(lower)) {
            req.query.is_active = true;
        } else if (['false', '0', 'inactive'].includes(lower)) {
            req.query.is_active = false;
        } else {
            return next(new AppError("Status filter must be a boolean ('true'/'false') or ('active'/'inactive').", 400));
        }
    }

    next();
}

/**
 * Validates payload for POST /api/users (Create Staff Account)
 */
function validateCreateUser(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { display_name, email, password, role, is_active } = req.body;

    // 1. Display name validation
    if (!display_name || typeof display_name !== 'string' || display_name.trim().length === 0) {
        return next(new AppError('Display name is required and cannot be empty.', 400));
    }

    const trimmedDisplayName = display_name.trim();
    if (trimmedDisplayName.length > 150) {
        return next(new AppError('Display name cannot exceed 150 characters.', 400));
    }

    // 2. Email validation
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return next(new AppError('Email address is required.', 400));
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 255) {
        return next(new AppError('Email address cannot exceed 255 characters.', 400));
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return next(new AppError('Please provide a valid email address.', 400));
    }

    // 3. Password validation
    if (!password || typeof password !== 'string' || password.length === 0) {
        return next(new AppError('Password is required.', 400));
    }

    if (password.length < 8) {
        return next(new AppError('Password must be at least 8 characters long.', 400));
    }

    if (password.length > 128) {
        return next(new AppError('Password cannot exceed 128 characters.', 400));
    }

    // 4. Role validation (optional, defaults to STAFF)
    if (role !== undefined) {
        const cleanRole = String(role).trim().toUpperCase();
        if (cleanRole !== 'ADMIN' && cleanRole !== 'STAFF') {
            return next(new AppError("Role must be either 'ADMIN' or 'STAFF'.", 400));
        }
    }

    // 5. Active status validation (optional, defaults to true)
    if (is_active !== undefined) {
        if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
            return next(new AppError('is_active must be a boolean value (true or false).', 400));
        }
    }

    next();
}

/**
 * Validates payload for PATCH /api/users/:id
 */
function validateUpdateUser(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('At least one permitted field (display_name, email, role, or is_active) must be provided to update.', 400));
    }

    // Explicitly reject direct password manipulation through profile update
    if (req.body.password !== undefined || req.body.password_hash !== undefined) {
        return next(new AppError('Direct password updates are not permitted via this endpoint. Use the password reset workflow.', 400));
    }

    // Explicitly reject tampering with identifiers or system fields
    if (req.body.user_id !== undefined || req.body.id !== undefined) {
        return next(new AppError('Updating internal user identifiers is not permitted.', 400));
    }

    if (req.body.created_at !== undefined || req.body.updated_at !== undefined || req.body.last_login_at !== undefined) {
        return next(new AppError('Updating system timestamps is not permitted.', 400));
    }

    const { display_name, email, role, is_active } = req.body;

    if (display_name === undefined && email === undefined && role === undefined && is_active === undefined) {
        return next(new AppError('At least one permitted field (display_name, email, role, or is_active) must be provided to update.', 400));
    }

    if (display_name !== undefined) {
        if (typeof display_name !== 'string' || display_name.trim().length === 0) {
            return next(new AppError('Display name cannot be empty.', 400));
        }
        if (display_name.trim().length > 150) {
            return next(new AppError('Display name cannot exceed 150 characters.', 400));
        }
    }

    if (email !== undefined) {
        if (typeof email !== 'string' || email.trim().length === 0) {
            return next(new AppError('Email address cannot be empty.', 400));
        }
        const trimmedEmail = email.trim();
        if (trimmedEmail.length > 255) {
            return next(new AppError('Email address cannot exceed 255 characters.', 400));
        }
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return next(new AppError('Please provide a valid email address.', 400));
        }
    }

    if (role !== undefined) {
        const cleanRole = String(role).trim().toUpperCase();
        if (cleanRole !== 'ADMIN' && cleanRole !== 'STAFF') {
            return next(new AppError("Role must be either 'ADMIN' or 'STAFF'.", 400));
        }
    }

    if (is_active !== undefined) {
        if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
            return next(new AppError('is_active must be a boolean value (true or false).', 400));
        }
    }

    next();
}

/**
 * Validates payload for PATCH /api/users/:id/status
 */
function validateUpdateUserStatus(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body must specify active/inactive status using is_active or status.', 400));
    }

    const { is_active, status } = req.body;

    if (is_active === undefined && status === undefined) {
        return next(new AppError('Please provide either is_active (boolean) or status (string).', 400));
    }

    let parsedActive;
    if (is_active !== undefined) {
        if (typeof is_active === 'boolean') {
            parsedActive = is_active;
        } else if (is_active === 1 || is_active === 'true' || is_active === '1') {
            parsedActive = true;
        } else if (is_active === 0 || is_active === 'false' || is_active === '0') {
            parsedActive = false;
        } else {
            return next(new AppError('is_active must be a valid boolean value (true or false).', 400));
        }
    } else {
        const lower = String(status).trim().toLowerCase();
        if (lower === 'active') {
            parsedActive = true;
        } else if (lower === 'inactive') {
            parsedActive = false;
        } else {
            return next(new AppError("status must be either 'ACTIVE' or 'INACTIVE'.", 400));
        }
    }

    req.body.is_active = parsedActive;
    next();
}

module.exports = {
    validateUserIdParam,
    validateListUsers,
    validateCreateUser,
    validateUpdateUser,
    validateUpdateUserStatus
};
