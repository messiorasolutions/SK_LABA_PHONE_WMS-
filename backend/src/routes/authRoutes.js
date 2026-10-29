const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateForgotPassword, validateResetPassword } = require('../validations/authValidation');
const { authenticate } = require('../middleware/authMiddleware');
const { loginRateLimiter, forgotPasswordRateLimiter, resetPasswordRateLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/login
router.post('/login', loginRateLimiter, validateLogin, (req, res, next) => {
    authController.login(req, res, next);
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res, next) => {
    authController.me(req, res, next);
});

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
    authController.logout(req, res, next);
});

// GET /api/auth/csrf-token
router.get('/csrf-token', (req, res, next) => {
    authController.getCsrfToken(req, res, next);
});

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordRateLimiter, validateForgotPassword, (req, res, next) => {
    authController.forgotPassword(req, res, next);
});

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordRateLimiter, validateResetPassword, (req, res, next) => {
    authController.resetPassword(req, res, next);
});

module.exports = router;
