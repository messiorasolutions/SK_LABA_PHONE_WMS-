const defaultPool = require('../config/db');

function formatUserId(id) {
    if (!id && id !== 0) return '';
    if (typeof id === 'string' && id.startsWith('SK_USER_')) return id;
    const num = parseInt(id, 10);
    if (isNaN(num)) return `SK_USER_${id}`;
    return `SK_USER_${String(num).padStart(2, '0')}`;
}

function mapUserRecord(row) {
    if (!row) return null;
    return {
        ...row,
        formatted_user_id: formatUserId(row.user_id)
    };
}

class DashboardUserRepository {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Create a new dashboard user
     * @param {Object} userData
     * @param {string} userData.display_name
     * @param {string} userData.email
     * @param {string} userData.password_hash
     * @param {'ADMIN'|'STAFF'} [userData.role='STAFF']
     * @param {boolean} [userData.is_active=true]
     * @param {'ACTIVE'|'PENDING'|'INACTIVE'} [userData.status='PENDING']
     * @param {string} [userData.verification_token_hash=null]
     * @param {Date|string} [userData.verification_expires_at=null]
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Object>} Created user record
     */
    async create(
        {
            display_name,
            email,
            password_hash,
            role = 'STAFF',
            is_active = true,
            status = 'PENDING',
            verification_token_hash = null,
            verification_expires_at = null
        },
        executor = this.pool
    ) {
        const cleanEmail = email.trim().toLowerCase();
        const query = `
            INSERT INTO dashboard_users (
                display_name, email, password_hash, role, is_active, status, verification_token_hash, verification_expires_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            display_name.trim(),
            cleanEmail,
            password_hash,
            role,
            Boolean(is_active) ? 1 : 0,
            status,
            verification_token_hash,
            verification_expires_at
        ];
        const [result] = await executor.execute(query, values);

        return await this.findById(result.insertId, executor);
    }

    /**
     * Find a dashboard user by user_id
     * @param {number|string} userId
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Object|null>}
     */
    async findById(userId, executor = this.pool) {
        const query = `
            SELECT user_id, display_name, email, avatar_url, role, is_active, status, last_login_at, created_at, updated_at
            FROM dashboard_users
            WHERE user_id = ?
        `;
        const [rows] = await executor.execute(query, [userId]);
        return rows.length > 0 ? mapUserRecord(rows[0]) : null;
    }

    /**
     * Find a dashboard user by user_id with exclusive row-level lock (FOR UPDATE)
     * @param {number|string} userId
     * @param {Object} executor - Must be a transactional connection
     * @returns {Promise<Object|null>}
     */
    async findByIdForUpdate(userId, executor = this.pool) {
        const query = `
            SELECT user_id, display_name, email, avatar_url, role, is_active, status, last_login_at, created_at, updated_at
            FROM dashboard_users
            WHERE user_id = ?
            FOR UPDATE
        `;
        const [rows] = await executor.execute(query, [userId]);
        return rows.length > 0 ? mapUserRecord(rows[0]) : null;
    }

    /**
     * Find user with password hash by user_id for credential verification
     * @param {number|string} userId
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Object|null>}
     */
    async findByIdWithPassword(userId, executor = this.pool) {
        const query = `
            SELECT user_id, display_name, email, avatar_url, password_hash, role, is_active, status, last_login_at, created_at, updated_at
            FROM dashboard_users
            WHERE user_id = ?
        `;
        const [rows] = await executor.execute(query, [userId]);
        return rows.length > 0 ? mapUserRecord(rows[0]) : null;
    }

    /**
     * Find user with password hash by email for authentication verification
     * @param {string} email
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Object|null>}
     */
    async findByEmailWithPassword(email, executor = this.pool) {
        const cleanEmail = email.trim().toLowerCase();
        const query = `
            SELECT user_id, display_name, email, avatar_url, password_hash, role, is_active, status, last_login_at, created_at, updated_at
            FROM dashboard_users
            WHERE LOWER(email) = ?
        `;
        const [rows] = await executor.execute(query, [cleanEmail]);
        return rows.length > 0 ? mapUserRecord(rows[0]) : null;
    }

    /**
     * Find a user by email (without password hash)
     * @param {string} email
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Object|null>}
     */
    async findByEmail(email, executor = this.pool) {
        const cleanEmail = email.trim().toLowerCase();
        const query = `
            SELECT user_id, display_name, email, avatar_url, role, is_active, status, last_login_at, created_at, updated_at
            FROM dashboard_users
            WHERE LOWER(email) = ?
        `;
        const [rows] = await executor.execute(query, [cleanEmail]);
        return rows.length > 0 ? mapUserRecord(rows[0]) : null;
    }

    /**
     * Find user by verification token hash
     * @param {string} tokenHash
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Object|null>}
     */
    async findByVerificationTokenHash(tokenHash, executor = this.pool) {
        const query = `
            SELECT user_id, display_name, email, password_hash, role, is_active, status, verification_expires_at
            FROM dashboard_users
            WHERE verification_token_hash = ?
        `;
        const [rows] = await executor.execute(query, [tokenHash]);
        return rows.length > 0 ? mapUserRecord(rows[0]) : null;
    }

    /**
     * Verify and activate user account with new password hash
     * @param {number|string} userId
     * @param {string} newPasswordHash
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Object>}
     */
    async verifyAndActivateUser(userId, newPasswordHash, executor = this.pool) {
        const query = `
            UPDATE dashboard_users
            SET password_hash = ?,
                status = 'ACTIVE',
                is_active = 1,
                verification_token_hash = NULL,
                verification_expires_at = NULL
            WHERE user_id = ?
        `;
        await executor.execute(query, [newPasswordHash, userId]);
        return await this.findById(userId, executor);
    }

    /**
     * Set a new verification token for a user
     * @param {number|string} userId
     * @param {string} tokenHash
     * @param {number} [expiresHours=72]
     * @param {Object} [executor]
     * @returns {Promise<boolean>}
     */
    async setVerificationToken(userId, tokenHash, expiresHours = 72, executor = this.pool) {
        const query = `
            UPDATE dashboard_users
            SET verification_token_hash = ?,
                verification_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? HOUR),
                status = 'PENDING'
            WHERE user_id = ?
        `;
        const [result] = await executor.execute(query, [tokenHash, expiresHours, userId]);
        return result.affectedRows > 0;
    }

    /**
     * Update last_login_at timestamp
     * @param {number|string} userId
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<boolean>}
     */
    async updateLastLogin(userId, executor = this.pool) {
        const query = `
            UPDATE dashboard_users
            SET last_login_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `;
        const [result] = await executor.execute(query, [userId]);
        return result.affectedRows > 0;
    }

    /**
     * Fetch all dashboard users (safe projection)
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Array>}
     */
    async findAll(executor = this.pool) {
        const query = `
            SELECT user_id, display_name, email, avatar_url, role, is_active, status, last_login_at, created_at, updated_at
            FROM dashboard_users
            ORDER BY created_at DESC
        `;
        const [rows] = await executor.execute(query);
        return rows.map(mapUserRecord);
    }

    /**
     * Count currently active administrators with explicit row-level locking support
     * @param {Object} [executor] - Optional connection or pool
     * @param {boolean} [lock=false] - Whether to acquire exclusive row-level locks with FOR UPDATE
     * @returns {Promise<number>}
     */
    async countActiveAdmins(executor = this.pool, lock = false) {
        if (lock) {
            const query = `
                SELECT user_id
                FROM dashboard_users
                WHERE role = 'ADMIN' AND is_active = TRUE
                ORDER BY user_id ASC
                FOR UPDATE
            `;
            const [rows] = await executor.execute(query);
            return rows ? rows.length : 0;
        }

        const query = `
            SELECT COUNT(*) AS total
            FROM dashboard_users
            WHERE role = 'ADMIN' AND is_active = TRUE
        `;
        const [rows] = await executor.execute(query);
        return rows[0] ? Number(rows[0].total) : 0;
    }

    /**
     * Query users with pagination, search, and filters
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @param {string} [options.search]
     * @param {'ADMIN'|'STAFF'} [options.role]
     * @param {string|boolean} [options.status] - 'ACTIVE', 'PENDING', 'INACTIVE'
     * @param {boolean|number} [options.is_active]
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<{ users: Array, pagination: Object }>}
     */
    async findUsers({ page = 1, limit = 10, search, role, status, is_active } = {}, executor = this.pool) {
        const conditions = [];
        const params = [];

        if (search && typeof search === 'string' && search.trim().length > 0) {
            const trimmed = search.trim();
            // Check if search matches formatted user id (e.g., SK_USER_01 or SK_USER_1 or numeric)
            let matchedId = null;
            const prefixMatch = trimmed.match(/^SK_USER_(\d+)$/i);
            if (prefixMatch) {
                matchedId = parseInt(prefixMatch[1], 10);
            } else if (/^\d+$/.test(trimmed)) {
                matchedId = parseInt(trimmed, 10);
            }

            if (matchedId !== null) {
                conditions.push('(display_name LIKE ? OR email LIKE ? OR user_id = ?)');
                params.push(`%${trimmed}%`, `%${trimmed}%`, matchedId);
            } else {
                conditions.push('(display_name LIKE ? OR email LIKE ?)');
                params.push(`%${trimmed}%`, `%${trimmed}%`);
            }
        }

        if (role && (role === 'ADMIN' || role === 'STAFF')) {
            conditions.push('role = ?');
            params.push(role);
        }

        if (status && typeof status === 'string') {
            const upperStatus = status.trim().toUpperCase();
            if (['ACTIVE', 'PENDING', 'INACTIVE'].includes(upperStatus)) {
                conditions.push('status = ?');
                params.push(upperStatus);
            }
        } else if (is_active !== undefined && is_active !== null && is_active !== '') {
            const isActiveBool =
                is_active === true ||
                is_active === 1 ||
                is_active === '1' ||
                String(is_active).trim().toLowerCase() === 'true' ||
                String(is_active).trim().toLowerCase() === 'active';
            conditions.push('is_active = ?');
            params.push(isActiveBool ? 1 : 0);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. Count query for total matching rows
        const countQuery = `SELECT COUNT(*) AS total FROM dashboard_users ${whereClause}`;
        const [countRows] = await executor.execute(countQuery, params);
        const total = countRows[0] ? Number(countRows[0].total) : 0;

        // 2. Pagination bounds calculation
        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (safePage - 1) * safeLimit;
        const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

        // 3. Paginated safe data query
        const dataQuery = `
            SELECT user_id, display_name, email, avatar_url, role, is_active, status, last_login_at, created_at, updated_at
            FROM dashboard_users
            ${whereClause}
            ORDER BY created_at DESC, user_id DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await executor.execute(dataQuery, [...params, safeLimit, offset]);

        return {
            users: rows.map(mapUserRecord),
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages
            }
        };
    }

    /**
     * Update permitted fields of a dashboard user
     * @param {number|string} userId
     * @param {Object} data
     * @param {string} [data.display_name]
     * @param {string} [data.email]
     * @param {string|null} [data.avatar_url]
     * @param {'ADMIN'|'STAFF'} [data.role]
     * @param {boolean|number} [data.is_active]
     * @param {'ACTIVE'|'PENDING'|'INACTIVE'} [data.status]
     * @param {string} [data.password_hash]
     * @param {string} [data.verification_token_hash]
     * @param {Date|string} [data.verification_expires_at]
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Object>} Updated user record
     */
    async updateUser(userId, data, executor = this.pool) {
        const fields = [];
        const values = [];

        if (data.display_name !== undefined) {
            fields.push('display_name = ?');
            values.push(data.display_name.trim());
        }

        if (data.email !== undefined) {
            fields.push('email = ?');
            values.push(data.email.trim().toLowerCase());
        }

        if (data.avatar_url !== undefined) {
            fields.push('avatar_url = ?');
            values.push(data.avatar_url ? String(data.avatar_url).trim() : null);
        }

        if (data.role !== undefined) {
            fields.push('role = ?');
            values.push(data.role);
        }

        if (data.is_active !== undefined) {
            fields.push('is_active = ?');
            values.push(Boolean(data.is_active) ? 1 : 0);
        }

        if (data.status !== undefined) {
            fields.push('status = ?');
            values.push(data.status);
        }

        if (data.password_hash !== undefined) {
            fields.push('password_hash = ?');
            values.push(data.password_hash);
        }

        if (data.verification_token_hash !== undefined) {
            fields.push('verification_token_hash = ?');
            values.push(data.verification_token_hash);
        }

        if (data.verification_expires_at !== undefined) {
            fields.push('verification_expires_at = ?');
            values.push(data.verification_expires_at);
        }

        if (fields.length === 0) {
            return await this.findById(userId, executor);
        }

        const query = `
            UPDATE dashboard_users
            SET ${fields.join(', ')}
            WHERE user_id = ?
        `;
        values.push(userId);

        await executor.execute(query, values);
        return await this.findById(userId, executor);
    }

    /**
     * Update user password hash
     * @param {number|string} userId
     * @param {string} passwordHash
     * @param {Object} [executor]
     * @returns {Promise<boolean>}
     */
    async updatePassword(userId, passwordHash, executor = this.pool) {
        const query = `
            UPDATE dashboard_users
            SET password_hash = ?
            WHERE user_id = ?
        `;
        const [result] = await executor.execute(query, [passwordHash, userId]);
        return result.affectedRows > 0;
    }

    /**
     * Update user active/inactive status
     * @param {number|string} userId
     * @param {boolean|number} is_active
     * @param {'ACTIVE'|'INACTIVE'|'PENDING'} [status]
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<Object>} Updated user record
     */
    async updateStatus(userId, is_active, status = null, executor = this.pool) {
        const resolvedStatus = status || (Boolean(is_active) ? 'ACTIVE' : 'INACTIVE');
        const query = `
            UPDATE dashboard_users
            SET is_active = ?, status = ?
            WHERE user_id = ?
        `;
        const activeValue = Boolean(is_active) ? 1 : 0;
        await executor.execute(query, [activeValue, resolvedStatus, userId]);
        return await this.findById(userId, executor);
    }

    /**
     * Revoke all active sessions belonging to the specified user
     * @param {number|string} userId
     * @param {Object} [executor] - Optional connection or pool
     * @returns {Promise<number>} Number of deleted session records
     */
    async revokeUserSessions(userId, executor = this.pool) {
        const query = `
            DELETE FROM sessions
            WHERE JSON_VALID(data)
              AND (
                  JSON_EXTRACT(data, '$.userId') = ?
                  OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.userId')) = CAST(? AS CHAR)
              )
        `;
        const [result] = await executor.execute(query, [userId, userId]);
        return result ? result.affectedRows : 0;
    }
}

module.exports = new DashboardUserRepository();
module.exports.DashboardUserRepository = DashboardUserRepository;
module.exports.formatUserId = formatUserId;
