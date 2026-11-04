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

        if (user.status === 'PENDING') {
            throw new AppError('Your account is pending email verification. Please check your email and verify your account.', 403);
        }

        if (!user.is_active || user.status === 'INACTIVE') {
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
            formatted_user_id: user.formatted_user_id,
            display_name: user.display_name,
            email: user.email,
            role: user.role,
            status: user.status,
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

        if (!user.is_active || user.status === 'INACTIVE') {
            throw new AppError('Unauthorized: Account is inactive. Please contact an administrator.', 401);
        }

        return {
            user_id: user.user_id,
            formatted_user_id: user.formatted_user_id,
            display_name: user.display_name,
            email: user.email,
            role: user.role,
            status: user.status,
            last_login_at: user.last_login_at,
            created_at: user.created_at
        };
    }

    /**
     * Verify user account with temporary password and establish new permanent password
     * @param {Object} data
     * @param {string} data.token
     * @param {string} [data.email]
     * @param {string} data.temporary_password
     * @param {string} data.new_password
     * @returns {Promise<Object>}
     */
    async verifyAccount({ token, email, temporary_password, new_password }) {
        if (!token || typeof token !== 'string') {
            throw new AppError('Verification token is missing or invalid.', 400);
        }
        if (!temporary_password || typeof temporary_password !== 'string') {
            throw new AppError('Temporary password is required.', 400);
        }
        if (!new_password || typeof new_password !== 'string' || new_password.length < 8) {
            throw new AppError('New password must be at least 8 characters long.', 400);
        }
        if (new_password.length > 128) {
            throw new AppError('New password cannot exceed 128 characters.', 400);
        }

        const rawToken = token.trim();
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Look up user by verification token hash
        const user = await this.userRepository.findByVerificationTokenHash(tokenHash);
        if (!user) {
            throw new AppError('Invalid or expired verification link. Please contact an administrator.', 400);
        }

        if (user.verification_expires_at) {
            const now = new Date();
            const expiresAt = new Date(user.verification_expires_at);
            if (expiresAt <= now) {
                throw new AppError('This verification link has expired. Please contact an administrator for a new one.', 400);
            }
        }

        if (email && email.trim() && user.email.toLowerCase() !== email.trim().toLowerCase()) {
            throw new AppError('Account email does not match the verification record.', 400);
        }

        // Verify temporary password against current password_hash
        const isTempValid = await PasswordUtil.verifyPassword(user.password_hash, temporary_password);
        if (!isTempValid) {
            throw new AppError('The temporary password you entered is incorrect.', 400);
        }

        // Hash new permanent password using Argon2id
        const newPasswordHash = await PasswordUtil.hashPassword(new_password);

        // Update password, set status to ACTIVE, clear token
        await this.userRepository.verifyAndActivateUser(user.user_id, newPasswordHash);

        // Revoke any existing sessions
        await this.userRepository.revokeUserSessions(user.user_id);

        return {
            success: true,
            message: 'Your account verified successfully. Use your credentials to sign in for your account.'
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
            if (user && user.is_active && user.status === 'ACTIVE') {
                const rawToken = crypto.randomBytes(32).toString('hex');
                const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

                const expiryMinutes = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES) || 15;
                const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

                await this.resetTokenRepository.invalidateActiveTokensForUser(user.user_id);

                await this.resetTokenRepository.create({
                    user_id: user.user_id,
                    token_hash: tokenHash,
                    expires_at: expiresAt
                });

                const frontendBaseUrl = process.env.PASSWORD_RESET_BASE_URL
                    || process.env.ADMIN_DASHBOARD_URL
                    || 'http://localhost:3000';

                const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

                await this.emailService.sendPasswordResetEmail({
                    to: user.email,
                    resetUrl,
                    displayName: user.display_name
                });
            }
        } catch (error) {
            console.error('[AuthService.forgotPassword] Internal error processing forgot password:', error.message);
        }

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

        const newPasswordHash = await PasswordUtil.hashPassword(newPassword);

        if (this.pool && typeof this.pool.getConnection === 'function') {
            const connection = await this.pool.getConnection();
            try {
                await connection.beginTransaction();

                const consumed = await this.resetTokenRepository.consumeTokenAtomic(record.reset_token_id, connection);
                if (!consumed) {
                    await connection.rollback();
                    throw new AppError(GENERIC_INVALID_TOKEN_MSG, 400);
                }

                await connection.execute(
                    'UPDATE dashboard_users SET password_hash = ? WHERE user_id = ?',
                    [newPasswordHash, record.user_id]
                );

                await this.resetTokenRepository.revokeUserSessions(record.user_id, connection);

                await connection.commit();
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } else {
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
