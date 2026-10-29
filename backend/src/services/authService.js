const crypto = require('crypto');
const defaultUserRepository = require('../repositories/dashboardUserRepository');
const defaultResetTokenRepository = require('../repositories/passwordResetTokenRepository');
const defaultEmailService = require('./emailService');
const defaultPool = require('../config/db');
const PasswordUtil = require('../utils/passwordUtil');
const AppError = require('../utils/customError');

// Constant dummy hash to mitigate timing attacks on nonexistent users
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHR2YWx1ZQ$qBvP7zC5t0v7w6Y8a2E4mO+F9+WzV91N3N1C9V6r12Y';
const GENERIC_FORGOT_PASSWORD_MSG = 'If an account matches that email, a password reset link has been sent.';
const GENERIC_INVALID_TOKEN_MSG = 'Invalid or expired password reset token.';

class AuthService {
    constructor(
        userRepository = defaultUserRepository,
        resetTokenRepository = defaultResetTokenRepository,
        emailService = defaultEmailService,
        pool = defaultPool
    ) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.emailService = emailService;
        this.pool = pool;
    }

    /**
     * Authenticate dashboard user credentials
     * @param {Object} credentials
     * @param {string} credentials.email
     * @param {string} credentials.password
     * @returns {Promise<Object>} Safe user record
     */
    async login({ email, password }) {
        const cleanEmail = email.trim().toLowerCase();

        const user = await this.userRepository.findByEmailWithPassword(cleanEmail);

        if (!user) {
            // Mitigate timing attacks by verifying a dummy hash before throwing
            await PasswordUtil.verifyPassword(DUMMY_HASH, password);
            throw new AppError('Invalid email or password.', 401);
        }

        if (!user.is_active) {
            throw new AppError('Account is inactive. Please contact an administrator.', 403);
        }

        const isPasswordValid = await PasswordUtil.verifyPassword(user.password_hash, password);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password.', 401);
        }

        // Record successful login timestamp
        try {
            await this.userRepository.updateLastLogin(user.user_id);
        } catch (err) {
            console.error('Warning: Failed to update last_login_at timestamp:', err.message);
        }

        return {
            user_id: user.user_id,
            display_name: user.display_name,
            email: user.email,
            role: user.role,
            last_login_at: new Date().toISOString()
        };
    }

    /**
     * Retrieve the currently authenticated user's profile
     * @param {number|string} userId
     * @returns {Promise<Object>} Safe user record
     */
    async getCurrentUser(userId) {
        if (!userId) {
            throw new AppError('Unauthorized: Authentication required.', 401);
        }

        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new AppError('Unauthorized: User no longer exists.', 401);
        }

        if (!user.is_active) {
            throw new AppError('Unauthorized: Account is inactive. Please contact an administrator.', 401);
        }

        return {
            user_id: user.user_id,
            display_name: user.display_name,
            email: user.email,
            role: user.role,
            last_login_at: user.last_login_at,
            created_at: user.created_at
        };
    }

    /**
     * Request a password reset link
     * @param {Object} data
     * @param {string} data.email
     * @returns {Promise<Object>} Generic safe response
     */
    async forgotPassword({ email }) {
        const cleanEmail = email.trim().toLowerCase();

        try {
            const user = await this.userRepository.findByEmail(cleanEmail);

            // Only generate and dispatch reset email if user exists and is active
            if (user && user.is_active) {
                // Generate cryptographically high-entropy raw token (64 hex characters)
                const rawToken = crypto.randomBytes(32).toString('hex');
                // Store only cryptographic SHA-256 hash
                const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

                const expiryMinutes = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES) || 15;
                const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

                // Invalidate any previously issued active tokens for this user
                await this.resetTokenRepository.invalidateActiveTokensForUser(user.user_id);

                // Insert new reset token
                await this.resetTokenRepository.create({
                    user_id: user.user_id,
                    token_hash: tokenHash,
                    expires_at: expiresAt
                });

                // Construct reset URL using strictly configured frontend URL
                const frontendBaseUrl = process.env.PASSWORD_RESET_BASE_URL
                    || process.env.ADMIN_DASHBOARD_URL
                    || 'https://admin.sklabaphone.com';

                const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

                // Send email (safe async call - failures do not leak to client)
                await this.emailService.sendPasswordResetEmail({
                    to: user.email,
                    resetUrl,
                    displayName: user.display_name
                });
            }
        } catch (error) {
            // Log sanitized error internally without exposing details to user
            console.error('[AuthService.forgotPassword] Internal error processing forgot password:', error.message);
        }

        // Always return identical generic success message to prevent user enumeration
        return {
            success: true,
            message: GENERIC_FORGOT_PASSWORD_MSG
        };
    }

    /**
     * Reset password using a valid, unconsumed token
     * @param {Object} data
     * @param {string} data.token - Raw reset token
     * @param {string} data.newPassword - New password
     * @returns {Promise<Object>} Success message
     */
    async resetPassword({ token, newPassword }) {
        if (!token || typeof token !== 'string') {
            throw new AppError(GENERIC_INVALID_TOKEN_MSG, 400);
        }

        const rawToken = token.trim();
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Look up token record
        const record = await this.resetTokenRepository.findByTokenHash(tokenHash);

        if (!record || record.is_consumed) {
            throw new AppError(GENERIC_INVALID_TOKEN_MSG, 400);
        }

        const now = new Date();
        const expiresAt = new Date(record.expires_at);
        if (expiresAt <= now) {
            throw new AppError(GENERIC_INVALID_TOKEN_MSG, 400);
        }

        if (!record.is_active) {
            throw new AppError(GENERIC_INVALID_TOKEN_MSG, 400);
        }

        // Hash new password using Argon2id
        const newPasswordHash = await PasswordUtil.hashPassword(newPassword);

        // Execute atomic consumption, password update, and session revocation inside transaction
        if (this.pool && typeof this.pool.getConnection === 'function') {
            const connection = await this.pool.getConnection();
            try {
                await connection.beginTransaction();

                // 1. Atomically consume token
                const consumed = await this.resetTokenRepository.consumeTokenAtomic(record.reset_token_id, connection);
                if (!consumed) {
                    await connection.rollback();
                    throw new AppError(GENERIC_INVALID_TOKEN_MSG, 400);
                }

                // 2. Update password hash
                await connection.execute(
                    'UPDATE dashboard_users SET password_hash = ? WHERE user_id = ?',
                    [newPasswordHash, record.user_id]
                );

                // 3. Revoke all active sessions belonging to the user
                await this.resetTokenRepository.revokeUserSessions(record.user_id, connection);

                await connection.commit();
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } else {
            // Fallback for mocked repository environments without pool connection
            const consumed = await this.resetTokenRepository.consumeTokenAtomic(record.reset_token_id);
            if (!consumed) {
                throw new AppError(GENERIC_INVALID_TOKEN_MSG, 400);
            }
            if (this.userRepository.updatePassword) {
                await this.userRepository.updatePassword(record.user_id, newPasswordHash);
            }
            await this.resetTokenRepository.revokeUserSessions(record.user_id);
        }

        return {
            success: true,
            message: 'Password has been reset successfully. Please log in with your new password.'
        };
    }
}

module.exports = new AuthService();
module.exports.AuthService = AuthService;
