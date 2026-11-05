const AppError = require('../utils/customError');

/**
 * Validates request payload for /api/auth/login
 */
function validateLogin(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return next(new AppError('Email address is required.', 400));
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 255) {
        return next(new AppError('Email address cannot exceed 255 characters.', 400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        return next(new AppError('Please provide a valid email address.', 400));
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
        return next(new AppError('Password is required.', 400));
    }

    if (password.length > 128) {
        return next(new AppError('Password cannot exceed 128 characters.', 400));
    }

    next();
}

/**
 * Validates request payload for /api/auth/forgot-password
 */
function validateForgotPassword(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { email } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return next(new AppError('Email address is required.', 400));
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 255) {
        return next(new AppError('Email address cannot exceed 255 characters.', 400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        return next(new AppError('Please provide a valid email address.', 400));
    }

    next();
}

/**
 * Validates request payload for /api/auth/reset-password
 */
function validateResetPassword(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
        return next(new AppError('Reset token is required.', 400));
    }

    if (token.trim().length > 128) {
        return next(new AppError('Invalid reset token format.', 400));
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length === 0) {
        return next(new AppError('New password is required.', 400));
    }

    if (newPassword.length < 8) {
        return next(new AppError('Password must be at least 8 characters long.', 400));
    }

    if (newPassword.length > 128) {
        return next(new AppError('Password cannot exceed 128 characters.', 400));
    }

    next();
}

/**
 * Validates request payload for /api/auth/profile
 */
function validateUpdateProfile(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
        return next(new AppError('Request body is missing or empty.', 400));
    }

    const { display_name, email } = req.body;

    if (display_name !== undefined) {
        if (typeof display_name !== 'string' || display_name.trim().length < 2) {
            return next(new AppError('Display name must be at least 2 characters long.', 400));
        }
        if (display_name.trim().length > 100) {
            return next(new AppError('Display name cannot exceed 100 characters.', 400));
        }
    }

    if (email !== undefined) {
        if (typeof email !== 'string' || email.trim().length === 0) {
            return next(new AppError('Email is required.', 400));
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return next(new AppError('Please enter a valid email address.', 400));
        }
    }

    next();
}

/**
 * Validates request payload for /api/auth/change-password
 */
function validateChangePassword(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
        return next(new AppError('Request body is missing or empty.', 400));
    }

    const { current_password, new_password } = req.body;

    if (!current_password || typeof current_password !== 'string' || current_password.length === 0) {
        return next(new AppError('Current password is required.', 400));
    }

    if (!new_password || typeof new_password !== 'string' || new_password.length < 8) {
        return next(new AppError('New password must be at least 8 characters long.', 400));
    }

    if (new_password.length > 128) {
        return next(new AppError('New password cannot exceed 128 characters.', 400));
    }

    const hasUpper = /[A-Z]/.test(new_password);
    const hasNumber = /[0-9]/.test(new_password);
    if (!hasUpper || !hasNumber) {
        return next(new AppError('New password must contain at least one uppercase letter and one number.', 400));
    }

    if (current_password === new_password) {
        return next(new AppError('New password cannot be the same as your current password.', 400));
    }

    next();
}

module.exports = {
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateUpdateProfile,
    validateChangePassword
};
