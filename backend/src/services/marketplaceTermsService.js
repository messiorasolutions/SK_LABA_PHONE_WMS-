/**
 * MarketplaceTermsService
 * Manages versioned Seller and Buyer Terms & Conditions for the Phone Marketplace.
 */

const defaultPool = require('../config/db');
const AppError = require('../utils/customError');

class MarketplaceTermsService {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Retrieves the latest active Terms & Conditions for the specified type.
     * @param {'SELLER'|'BUYER'} termType
     * @returns {Promise<Object>}
     */
    async getActiveTerms(termType) {
        const type = String(termType).toUpperCase();
        if (!['SELLER', 'BUYER'].includes(type)) {
            throw new AppError('Invalid terms type. Must be SELLER or BUYER.', 400);
        }

        const query = `
            SELECT id, term_type, version, title, content, is_active, created_at, updated_at
            FROM marketplace_terms
            WHERE term_type = ? AND is_active = TRUE
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const [rows] = await this.pool.query(query, [type]);
        if (rows.length === 0) {
            // Fallback default if not seeded
            return {
                id: 0,
                term_type: type,
                version: '1.0',
                title: `SK LABA PHONE Marketplace ${type === 'SELLER' ? 'Seller' : 'Buyer'} Terms & Conditions`,
                content: 'Standard marketplace terms apply.',
                is_active: true
            };
        }
        return rows[0];
    }

    /**
     * Lists all terms versions for admin review.
     * @param {'SELLER'|'BUYER'} [termType]
     * @returns {Promise<Array<Object>>}
     */
    async listTermsHistory(termType = null) {
        let query = `
            SELECT t.id, t.term_type, t.version, t.title, t.content, t.is_active, t.created_at, t.updated_at,
                   u.display_name AS created_by_name
            FROM marketplace_terms t
            LEFT JOIN dashboard_users u ON t.created_by = u.user_id
        `;
        const params = [];
        if (termType) {
            query += ' WHERE t.term_type = ?';
            params.push(String(termType).toUpperCase());
        }
        query += ' ORDER BY t.created_at DESC';

        const [rows] = await this.pool.query(query, params);
        return rows;
    }

    /**
     * Creates a new version of Terms & Conditions and marks prior active ones as inactive.
     * @param {Object} data
     * @param {'SELLER'|'BUYER'} data.term_type
     * @param {string} data.version - e.g. "1.1" or "2.0"
     * @param {string} data.title
     * @param {string} data.content
     * @param {number} adminUserId
     * @returns {Promise<Object>}
     */
    async createTermsVersion({ term_type, version, title, content }, adminUserId) {
        const type = String(term_type).toUpperCase();
        if (!['SELLER', 'BUYER'].includes(type)) {
            throw new AppError('Invalid terms type. Must be SELLER or BUYER.', 400);
        }

        let finalVersion = version;
        if (!finalVersion || typeof finalVersion !== 'string' || finalVersion.trim().length === 0) {
            const current = await this.getActiveTerms(type);
            const num = parseFloat(current?.version || '1.0');
            finalVersion = !isNaN(num) ? (num + 0.1).toFixed(1) : `${current?.version || '1.0'}.1`;
        }

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new AppError('Terms title is required.', 400);
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            throw new AppError('Terms content is required.', 400);
        }

        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Deactivate older active terms of this type
            await connection.query(
                'UPDATE marketplace_terms SET is_active = FALSE WHERE term_type = ?',
                [type]
            );

            // Insert new active terms
            const insertQuery = `
                INSERT INTO marketplace_terms (term_type, version, title, content, is_active, created_by)
                VALUES (?, ?, ?, ?, TRUE, ?)
            `;
            const [result] = await connection.query(insertQuery, [
                type,
                finalVersion.trim(),
                title.trim(),
                content.trim(),
                adminUserId || null
            ]);

            // Audit log
            const auditAction = type === 'SELLER' ? 'SELLER_TERMS_UPDATED' : 'BUYER_TERMS_UPDATED';
            const auditQuery = `
                INSERT INTO marketplace_audit_logs (entity_type, entity_id, action, actor_user_id, actor_role, details)
                VALUES ('TERMS', ?, ?, ?, 'ADMIN', ?)
            `;
            const details = JSON.stringify({
                version: finalVersion.trim(),
                title: title.trim(),
                created_at: new Date().toISOString()
            });
            await connection.query(auditQuery, [result.insertId, auditAction, adminUserId || null, details]);

            await connection.commit();

            return await this.getActiveTerms(type);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

const defaultTermsService = new MarketplaceTermsService();

module.exports = defaultTermsService;
module.exports.MarketplaceTermsService = MarketplaceTermsService;
