const argon2 = require('argon2');

/**
 * Utility for hashing and verifying passwords using Argon2id.
 */
class PasswordUtil {
    /**
     * Hash a plain text password with Argon2id.
     * @param {string} password - The plain text password
     * @returns {Promise<string>} The hashed password
     */
    static async hashPassword(password) {
        if (!password || typeof password !== 'string') {
            throw new Error('Password must be a non-empty string');
        }
        return await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16, // 64 MB
            timeCost: 3,         // 3 iterations
            parallelism: 1
        });
    }

    /**
     * Verify a plain text password against an Argon2id hash.
     * @param {string} hash - The stored Argon2id hash
     * @param {string} password - The candidate plain text password
     * @returns {Promise<boolean>} True if match, false otherwise
     */
    static async verifyPassword(hash, password) {
        if (!hash || !password || typeof hash !== 'string' || typeof password !== 'string') {
            return false;
        }
        try {
            return await argon2.verify(hash, password);
        } catch (error) {
            return false;
        }
    }
}

module.exports = PasswordUtil;
