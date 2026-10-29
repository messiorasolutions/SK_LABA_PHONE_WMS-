const defaultUserRepository = require('../repositories/dashboardUserRepository');
const defaultPool = require('../config/db');
const PasswordUtil = require('../utils/passwordUtil');
const AppError = require('../utils/customError');

class UserService {
    constructor(userRepository = defaultUserRepository, pool = defaultPool) {
        this.userRepository = userRepository;
        this.pool = pool;
    }

    /**
     * List users with pagination, search, and filters
     * @param {Object} queryOptions
     * @param {number} [queryOptions.page=1]
     * @param {number} [queryOptions.limit=10]
     * @param {string} [queryOptions.search]
     * @param {'ADMIN'|'STAFF'} [queryOptions.role]
     * @param {boolean} [queryOptions.is_active]
     * @returns {Promise<{ users: Array, pagination: Object }>}
     */
    async listUsers(queryOptions = {}) {
        const { page = 1, limit = 10, search, role, is_active } = queryOptions;

        return await this.userRepository.findUsers({
            page,
            limit,
            search,
            role,
            is_active
        });
    }

    /**
     * Get user details by user_id
     * @param {number|string} userId
     * @returns {Promise<Object>} Safe user record
     */
    async getUserById(userId) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new AppError('User not found.', 404);
        }

        const safeUser = { ...user };
        delete safeUser.password_hash;
        return safeUser;
    }

    /**
     * Create a new staff or admin user
     * @param {Object} userData
     * @param {string} userData.display_name
     * @param {string} userData.email
     * @param {string} userData.password
     * @param {'ADMIN'|'STAFF'} [userData.role='STAFF']
     * @param {boolean} [userData.is_active=true]
     * @returns {Promise<Object>} Created safe user record
     */
    async createUser({ display_name, email, password, role = 'STAFF', is_active = true }) {
        const cleanEmail = email.trim().toLowerCase();

        // 1. Check duplicate email to return a clean 409 Conflict
        const existingUser = await this.userRepository.findByEmail(cleanEmail);
        if (existingUser) {
            throw new AppError('A user with this email address already exists.', 409);
        }

        // 2. Hash password using Argon2id utility
        const password_hash = await PasswordUtil.hashPassword(password);

        // 3. Create user record
        const newUser = await this.userRepository.create({
            display_name: display_name.trim(),
            email: cleanEmail,
            password_hash,
            role: role || 'STAFF',
            is_active: is_active !== undefined ? Boolean(is_active) : true
        });

        // 4. Return safe representation (never expose password_hash)
        return {
            user_id: newUser.user_id,
            display_name: newUser.display_name,
            email: newUser.email,
            role: newUser.role,
            is_active: newUser.is_active,
            created_at: newUser.created_at,
            updated_at: newUser.updated_at
        };
    }

    /**
     * Update permitted fields of a user with concurrency protection and last-admin safeguard
     * @param {number|string} userId
     * @param {Object} updateData
     * @param {string} [updateData.display_name]
     * @param {string} [updateData.email]
     * @param {'ADMIN'|'STAFF'} [updateData.role]
     * @param {boolean} [updateData.is_active]
     * @param {number|string} currentUserId - The authenticated admin performing the update
     * @returns {Promise<Object>} Updated safe user record
     */
    async updateUser(userId, updateData, currentUserId) {
        const permitted = {};
        if (updateData.display_name !== undefined) permitted.display_name = updateData.display_name.trim();
        if (updateData.email !== undefined) permitted.email = updateData.email.trim().toLowerCase();
        if (updateData.role !== undefined) permitted.role = updateData.role;
        if (updateData.is_active !== undefined) permitted.is_active = Boolean(updateData.is_active);

        // Check if environment supports transactional connections
        if (this.pool && typeof this.pool.getConnection === 'function') {
            const connection = await this.pool.getConnection();
            let transactionActive = false;
            try {
                await connection.beginTransaction();
                transactionActive = true;

                // 1. Lock the target user row exclusively
                const targetUser = await this.userRepository.findByIdForUpdate(userId, connection);
                if (!targetUser) {
                    throw new AppError('User not found.', 404);
                }

                const isTargetActiveAdmin = targetUser.role === 'ADMIN' && Boolean(targetUser.is_active);
                const willDemote = permitted.role !== undefined && permitted.role !== 'ADMIN';
                const willDeactivate = permitted.is_active !== undefined && !permitted.is_active;

                // 2. Prevent removal or deactivation of the last active ADMIN with row lock
                if (isTargetActiveAdmin && (willDemote || willDeactivate)) {
                    const activeAdmins = await this.userRepository.countActiveAdmins(connection, true);
                    if (activeAdmins <= 1) {
                        throw new AppError('Cannot demote or deactivate the last active administrator.', 400);
                    }
                }

                // 3. Prevent an administrator from deactivating their own account
                if (willDeactivate && Number(currentUserId) === Number(userId)) {
                    throw new AppError('Administrators cannot deactivate their own account.', 400);
                }

                // 4. Validate email uniqueness if changing email
                if (permitted.email && permitted.email !== targetUser.email.toLowerCase()) {
                    const existing = await this.userRepository.findByEmail(permitted.email, connection);
                    if (existing && Number(existing.user_id) !== Number(userId)) {
                        throw new AppError('A user with this email address already exists.', 409);
                    }
                }

                // 5. Apply the update
                await this.userRepository.updateUser(userId, permitted, connection);

                // 6. Revoke active sessions if account was deactivated
                if (willDeactivate) {
                    await this.userRepository.revokeUserSessions(userId, connection);
                }

                const updated = await this.userRepository.findById(userId, connection);
                await connection.commit();
                transactionActive = false;
                if (updated) delete updated.password_hash;
                return updated;
            } catch (error) {
                if (transactionActive) {
                    try {
                        await connection.rollback();
                    } catch (rollbackError) {
                        console.error('Failed to rollback transaction:', rollbackError.message);
                    }
                }

                // Handle deadlock or lock wait timeout safely as operational 409 Conflict
                if (error.code === 'ER_LOCK_DEADLOCK' || error.errno === 1213 || error.code === 'ER_LOCK_WAIT_TIMEOUT' || error.errno === 1205) {
                    throw new AppError('Conflict: Concurrent administrative update in progress. Please retry.', 409);
                }

                throw error;
            } finally {
                connection.release();
            }
        } else {
            // Fallback for mocked test environments without database connection pool
            const targetUser = await this.userRepository.findById(userId);
            if (!targetUser) {
                throw new AppError('User not found.', 404);
            }

            const isTargetActiveAdmin = targetUser.role === 'ADMIN' && Boolean(targetUser.is_active);
            const willDemote = permitted.role !== undefined && permitted.role !== 'ADMIN';
            const willDeactivate = permitted.is_active !== undefined && !permitted.is_active;

            if (isTargetActiveAdmin && (willDemote || willDeactivate)) {
                const activeAdmins = await this.userRepository.countActiveAdmins();
                if (activeAdmins <= 1) {
                    throw new AppError('Cannot demote or deactivate the last active administrator.', 400);
                }
            }

            if (willDeactivate && Number(currentUserId) === Number(userId)) {
                throw new AppError('Administrators cannot deactivate their own account.', 400);
            }

            if (permitted.email && permitted.email !== targetUser.email.toLowerCase()) {
                const existing = await this.userRepository.findByEmail(permitted.email);
                if (existing && Number(existing.user_id) !== Number(userId)) {
                    throw new AppError('A user with this email address already exists.', 409);
                }
            }

            const updated = await this.userRepository.updateUser(userId, permitted);

            if (willDeactivate && typeof this.userRepository.revokeUserSessions === 'function') {
                await this.userRepository.revokeUserSessions(userId);
            }

            if (updated) delete updated.password_hash;
            return updated;
        }
    }

    /**
     * Update user active/inactive status
     * @param {number|string} userId
     * @param {boolean} isActive
     * @param {number|string} currentUserId
     * @returns {Promise<Object>} Updated safe user record
     */
    async updateUserStatus(userId, isActive, currentUserId) {
        return await this.updateUser(userId, { is_active: isActive }, currentUserId);
    }
}

module.exports = new UserService();
module.exports.UserService = UserService;
