const { rateLimit } = require('express-rate-limit');

/**
 * Rate limiter middleware for login endpoint to mitigate brute-force attacks.
 */
const loginRateLimiter = rateLimit({
    windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || (15 * 60 * 1000), // 15 minutes
    limit: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5, // 5 attempts per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
    },
    // Bypass in test mode unless explicitly testing rate limiting via header
    skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']
});

/**
 * Rate limiter middleware for forgot password endpoint to prevent email spam / enumeration.
 */
const forgotPasswordRateLimiter = rateLimit({
    windowMs: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS) || (15 * 60 * 1000), // 15 minutes
    limit: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX) || 5, // 5 attempts per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password reset requests from this IP. Please try again after 15 minutes.'
    },
    skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']
});

/**
 * Rate limiter middleware for reset password attempts.
 */
const resetPasswordRateLimiter = rateLimit({
    windowMs: Number(process.env.RESET_PASSWORD_RATE_LIMIT_WINDOW_MS) || (15 * 60 * 1000), // 15 minutes
    limit: Number(process.env.RESET_PASSWORD_RATE_LIMIT_MAX) || 10, // 10 attempts per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password reset submissions from this IP. Please try again after 15 minutes.'
    },
    skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']
});

/**
 * Rate limiter middleware for public customer inquiry submissions to prevent spam and abuse.
 */
const inquiryRateLimiter = rateLimit({
    windowMs: Number(process.env.INQUIRY_RATE_LIMIT_WINDOW_MS) || (15 * 60 * 1000), // 15 minutes
    limit: Number(process.env.INQUIRY_RATE_LIMIT_MAX) || 10, // 10 attempts per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many inquiry submissions from this IP. Please try again after 15 minutes.'
    },
    skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']
});

module.exports = {
    loginRateLimiter,
    forgotPasswordRateLimiter,
    resetPasswordRateLimiter,
    inquiryRateLimiter
};
