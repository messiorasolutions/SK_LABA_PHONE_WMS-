const defaultPool = require('../config/db');

class PasswordResetTokenRepository {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Store a new password reset token hash
     * @param {Object} tokenData
     * @param {number|string} tokenData.user_id
     * @param {string} tokenData.token_hash
     * @param {Date|string} tokenData.expires_at
     * @param {Object} [executor] - Connection or pool
     * @returns {Promise<Object>} Inserted record info
     */
    async create({ user_id, token_hash, expires_at }, executor = this.pool) {
        const query = `
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        `;
        const [result] = await executor.execute(query, [user_id, token_hash, expires_at]);
        return {
            reset_token_id: result.insertId,
            user_id,
            token_hash,
            expires_at
        };
    }

    /**
     * Find token by its SHA-256 hash with associated user details
     * @param {string} token_hash
     * @param {Object} [executor] - Connection or pool
     * @returns {Promise<Object|null>}
     */
    async findByTokenHash(token_hash, executor = this.pool) {
        const query = `
            SELECT 
                prt.reset_token_id,
                prt.user_id,
                prt.token_hash,
                prt.expires_at,
                prt.is_consumed,
                prt.consumed_at,
                prt.created_at,
                u.email,
                u.display_name,
                u.role,
                u.is_active
            FROM password_reset_tokens prt
            JOIN dashboard_users u ON prt.user_id = u.user_id
            WHERE prt.token_hash = ?
        `;
        const [rows] = await executor.execute(query, [token_hash]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Atomically consume token so concurrent requests cannot reuse it
     * @param {number|string} reset_token_id
     * @param {Object} [executor] - Connection or pool
     * @returns {Promise<boolean>} True if successfully consumed, false if already consumed or expired
     */
    async consumeTokenAtomic(reset_token_id, executor = this.pool) {
        const query = `
            UPDATE password_reset_tokens
            SET is_consumed = TRUE, consumed_at = CURRENT_TIMESTAMP
            WHERE reset_token_id = ?
              AND is_consumed = FALSE
              AND expires_at > CURRENT_TIMESTAMP
        `;
        const [result] = await executor.execute(query, [reset_token_id]);
        return result.affectedRows > 0;
    }

    /**
     * Invalidate any previous unconsumed reset tokens for a user
     * @param {number|string} user_id
     * @param {Object} [executor] - Connection or pool
     * @returns {Promise<number>} Number of invalidated tokens
     */
    async invalidateActiveTokensForUser(user_id, executor = this.pool) {
        const query = `
            UPDATE password_reset_tokens
            SET is_consumed = TRUE, consumed_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND is_consumed = FALSE
        `;
        const [result] = await executor.execute(query, [user_id]);
        return result.affectedRows;
    }

    /**
     * Revoke all active sessions for a user from the sessions table
     * @param {number|string} user_id
     * @param {Object} [executor] - Connection or pool
     * @returns {Promise<number>} Number of deleted sessions
     */
    async revokeUserSessions(user_id, executor = this.pool) {
        const query = `
            DELETE FROM sessions
            WHERE JSON_VALID(data)
              AND (
                  JSON_EXTRACT(data, '$.userId') = ?
                  OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.userId')) = CAST(? AS CHAR)
              )
        `;
        const [result] = await executor.execute(query, [user_id, user_id]);
        return result.affectedRows;
    }
}

module.exports = new PasswordResetTokenRepository();
module.exports.PasswordResetTokenRepository = PasswordResetTokenRepository;
