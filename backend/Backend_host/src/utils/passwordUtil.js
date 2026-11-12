const bcrypt = require('bcryptjs');

/**
 * Utility for hashing and verifying passwords using bcryptjs.
 * Pure JavaScript implementation with zero native C++ dependencies,
 * making it 100% compatible with cPanel / CloudLinux / shared hosting.
 */
class PasswordUtil {
    /**
     * Hash a plain text password with bcryptjs.
     * @param {string} password - The plain text password
     * @returns {Promise<string>} The hashed password
     */
    static async hashPassword(password) {
        if (!password || typeof password !== 'string') {
            throw new Error('Password must be a non-empty string');
        }
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    /**
     * Verify a plain text password against a stored hash.
     * @param {string} hash - The stored hash
     * @param {string} password - The candidate plain text password
     * @returns {Promise<boolean>} True if match, false otherwise
     */
    static async verifyPassword(hash, password) {
        if (!hash || !password || typeof hash !== 'string' || typeof password !== 'string') {
            return false;
        }
        try {
            if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
                return await bcrypt.compare(password, hash);
            }
            return false;
        } catch (error) {
            return false;
        }
    }
}

module.exports = PasswordUtil;
