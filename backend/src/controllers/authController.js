const crypto = require('crypto');
const defaultAuthService = require('../services/authService');
const createSessionMiddleware = require('../config/session');
const AppError = require('../utils/customError');

class AuthController {
    constructor(authService = defaultAuthService) {
        this.authService = authService;
        const { cookieName, cookieOptions } = createSessionMiddleware();
        this.cookieName = cookieName;
        this.cookieOptions = cookieOptions;
    }

    /**
     * POST /api/auth/login
     * Authenticates user, regenerates session, and returns safe profile
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const user = await this.authService.login({ email, password });

            // Session regeneration prevents session fixation attacks
            if (req.session) {
                req.session.regenerate((err) => {
                    if (err) {
                        return next(new AppError('Session initialization failed.', 500));
                    }

                    const csrfToken = crypto.randomBytes(32).toString('hex');
                    req.session.userId = user.user_id;
                    req.session.role = user.role;
                    req.session.csrfToken = csrfToken;

                    req.session.save((saveErr) => {
                        if (saveErr) {
                            return next(new AppError('Failed to persist session.', 500));
                        }

                        return res.status(200).json({
                            success: true,
                            message: 'Login successful',
                            data: {
                                user: {
                                    user_id: user.user_id,
                                    display_name: user.display_name,
                                    email: user.email,
                                    role: user.role,
                                    last_login_at: user.last_login_at
                                },
                                csrfToken
                            }
                        });
                    });
                });
            } else {
                // If session is absent (e.g. unconfigured environment)
                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    data: { user }
                });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/me
     * Returns currently authenticated user safe profile
     */
    async me(req, res, next) {
        try {
            if (!req.user) {
                return next(new AppError('Unauthorized: Authentication required.', 401));
            }

            return res.status(200).json({
                success: true,
                data: {
                    user: req.user
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/logout
     * Invalidates server-side session and clears session cookie
     */
    async logout(req, res, next) {
        try {
            const clearCookie = () => {
                res.clearCookie(this.cookieName, {
                    path: '/',
                    httpOnly: this.cookieOptions.httpOnly,
                    secure: this.cookieOptions.secure,
                    sameSite: this.cookieOptions.sameSite,
                    domain: this.cookieOptions.domain
                });
            };

            if (req.session) {
                req.session.destroy((err) => {
                    clearCookie();
                    if (err) {
                        return next(new AppError('Failed to cleanly destroy session.', 500));
                    }
                    return res.status(200).json({
                        success: true,
                        message: 'Logged out successfully'
                    });
                });
            } else {
                clearCookie();
                return res.status(200).json({
                    success: true,
                    message: 'Logged out successfully'
                });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/csrf-token
     * Returns or creates a CSRF token for the session
     */
    async getCsrfToken(req, res, next) {
        try {
            if (!req.session) {
                return next(new AppError('Session not available.', 500));
            }

            if (!req.session.csrfToken) {
                req.session.csrfToken = crypto.randomBytes(32).toString('hex');
            }

            return res.status(200).json({
                success: true,
                csrfToken: req.session.csrfToken
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/forgot-password
     * Request a password reset link
     */
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const result = await this.authService.forgotPassword({ email });
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/reset-password
     * Reset password using token
     */
    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            const result = await this.authService.resetPassword({ token, newPassword });
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
module.exports.AuthController = AuthController;
