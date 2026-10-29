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

module.exports = {
    validateLogin,
    validateForgotPassword,
    validateResetPassword
};
