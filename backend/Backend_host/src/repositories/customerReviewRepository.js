const defaultPool = require('../config/db');

class CustomerReviewRepository {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Format raw database review row into structured dashboard domain object
     */
    _formatReview(row) {
        if (!row) return null;

        return {
            review_id: Number(row.review_id),
            customer_name: row.customer_name,
            rating: Number(row.rating),
            comment: row.comment,
            status: row.status,
            moderated_by_user_id: row.moderated_by_user_id ? Number(row.moderated_by_user_id) : null,
            moderated_at: row.moderated_at || null,
            moderator: row.moderated_by_user_id ? {
                user_id: Number(row.moderated_by_user_id),
                display_name: row.moderator_name || null,
                email: row.moderator_email || null
            } : null,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    /**
     * Format public review domain object (only customer-facing fields, no internal moderation data)
     */
    _formatPublicReview(row) {
        if (!row) return null;

        return {
            review_id: Number(row.review_id),
            customer_name: row.customer_name,
            rating: Number(row.rating),
            comment: row.comment,
            created_at: row.created_at
        };
    }

    /**
     * Insert a new customer review with default 'Pending' status
     * @param {Object} reviewData
     * @returns {Promise<Object>} Formatted created review
     */
    async create({ customer_name, rating, comment, status = 'Pending' }) {
        const query = `
            INSERT INTO customer_reviews (
                customer_name, rating, comment, status
            ) VALUES (?, ?, ?, ?)
        `;
        const values = [customer_name, rating, comment, status];

        const [result] = await this.pool.execute(query, values);
        return this.findById(result.insertId);
    }

    /**
     * Find a single review by ID with joined moderator details
     * @param {number|string} review_id
     * @returns {Promise<Object|null>}
     */
    async findById(review_id) {
        const query = `
            SELECT 
                r.review_id,
                r.customer_name,
                r.rating,
                r.comment,
                r.status,
                r.moderated_by_user_id,
                r.moderated_at,
                r.created_at,
                r.updated_at,
                u.display_name AS moderator_name,
                u.email AS moderator_email
            FROM customer_reviews r
            LEFT JOIN dashboard_users u ON r.moderated_by_user_id = u.user_id
            WHERE r.review_id = ?
        `;
        const [rows] = await this.pool.execute(query, [review_id]);
        return rows.length > 0 ? this._formatReview(rows[0]) : null;
    }

    /**
     * Find only Approved reviews for public website rendering
     * Enforces status = 'Approved' strictly in repository query
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=20]
     * @returns {Promise<Array>}
     */
    async findApprovedReviews({ page = 1, limit = 20 } = {}) {
        const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 50);
        const safePage = Math.max(1, Number(page) || 1);
        const offset = (safePage - 1) * safeLimit;

        const query = `
            SELECT 
                review_id,
                customer_name,
                rating,
                comment,
                created_at
            FROM customer_reviews
            WHERE status = 'Approved'
            ORDER BY created_at DESC, review_id DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await this.pool.execute(query, [String(safeLimit), String(offset)]);
        return rows.map((row) => this._formatPublicReview(row));
    }

    /**
     * Count total Approved reviews for public pagination
     * @returns {Promise<number>}
     */
    async countApprovedReviews() {
        const query = `
            SELECT COUNT(*) AS total
            FROM customer_reviews
            WHERE status = 'Approved'
        `;
        const [rows] = await this.pool.execute(query);
        return Number(rows[0]?.total || 0);
    }

    /**
     * Find reviews for dashboard administration with filtering, search, and pagination
     * @param {Object} options
     * @returns {Promise<Array>}
     */
    async findReviews({
        page = 1,
        limit = 20,
        status = null,
        search = null,
        sortBy = 'created_at',
        sortOrder = 'DESC'
    } = {}) {
        const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
        const safePage = Math.max(1, Number(page) || 1);
        const offset = (safePage - 1) * safeLimit;

        let query = `
            SELECT 
                r.review_id,
                r.customer_name,
                r.rating,
                r.comment,
                r.status,
                r.moderated_by_user_id,
                r.moderated_at,
                r.created_at,
                r.updated_at,
                u.display_name AS moderator_name,
                u.email AS moderator_email
            FROM customer_reviews r
            LEFT JOIN dashboard_users u ON r.moderated_by_user_id = u.user_id
            WHERE 1=1
        `;
        const values = [];

        if (status && status !== 'ALL') {
            query += ' AND r.status = ?';
            values.push(status);
        }

        if (search && search.trim().length > 0) {
            query += ' AND (r.customer_name LIKE ? OR r.comment LIKE ?)';
            const keyword = `%${search.trim()}%`;
            values.push(keyword, keyword);
        }

        // Safe column whitelisting for sorting
        const allowedSortCols = {
            created_at: 'r.created_at',
            rating: 'r.rating',
            review_id: 'r.review_id',
            status: 'r.status',
            customer_name: 'r.customer_name'
        };
        const sortCol = allowedSortCols[sortBy] || 'r.created_at';
        const cleanOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${sortCol} ${cleanOrder}, r.review_id DESC LIMIT ? OFFSET ?`;
        values.push(String(safeLimit), String(offset));

        const [rows] = await this.pool.execute(query, values);
        return rows.map((row) => this._formatReview(row));
    }

    /**
     * Count reviews matching dashboard filters
     * @param {Object} filters
     * @returns {Promise<number>}
     */
    async countReviews({ status = null, search = null } = {}) {
        let query = 'SELECT COUNT(*) AS total FROM customer_reviews r WHERE 1=1';
        const values = [];

        if (status && status !== 'ALL') {
            query += ' AND r.status = ?';
            values.push(status);
        }

        if (search && search.trim().length > 0) {
            query += ' AND (r.customer_name LIKE ? OR r.comment LIKE ?)';
            const keyword = `%${search.trim()}%`;
            values.push(keyword, keyword);
        }

        const [rows] = await this.pool.execute(query, values);
        return Number(rows[0]?.total || 0);
    }

    /**
     * Update review moderation status and record moderator user attribution
     * @param {number|string} review_id
     * @param {'Approved'|'Rejected'} status
     * @param {number} moderated_by_user_id
     * @returns {Promise<Object|null>}
     */
    async updateStatus(review_id, status, moderated_by_user_id) {
        const query = `
            UPDATE customer_reviews
            SET 
                status = ?,
                moderated_by_user_id = ?,
                moderated_at = CURRENT_TIMESTAMP
            WHERE review_id = ?
        `;
        await this.pool.execute(query, [status, moderated_by_user_id, review_id]);
        return this.findById(review_id);
    }
}

module.exports = new CustomerReviewRepository();
module.exports.CustomerReviewRepository = CustomerReviewRepository;
