const pool = require('../config/db');

class OfferRepository {
    /**
     * Safely parse JSON and format raw offer row
     */
    _formatOffer(row) {
        if (!row) return null;
        const formatted = { ...row };

        formatted.offer_id = Number(formatted.offer_id);
        formatted.regular_price = Number(formatted.regular_price);
        formatted.offer_price = Number(formatted.offer_price);

        if (formatted.phone_ids && typeof formatted.phone_ids === 'string') {
            try {
                formatted.phone_ids = JSON.parse(formatted.phone_ids);
            } catch (e) { // eslint-disable-line no-unused-vars
                formatted.phone_ids = [];
            }
        } else if (!Array.isArray(formatted.phone_ids)) {
            formatted.phone_ids = [];
        }

        // Calculate discount amount and discount percentage
        const discountAmount = Number((formatted.regular_price - formatted.offer_price).toFixed(2));
        const discountPercentage = formatted.regular_price > 0
            ? Number(((discountAmount / formatted.regular_price) * 100).toFixed(1))
            : 0;

        formatted.discount_amount = discountAmount;
        formatted.discount_percentage = discountPercentage;

        // Dynamic lifecycle stage
        const now = new Date();
        const start = new Date(formatted.start_date_time);
        const end = new Date(formatted.end_date_time);

        if (formatted.status === 'DRAFT') {
            formatted.stage = 'DRAFT';
            formatted.is_active = false;
            formatted.seconds_remaining = 0;
        } else if (now < start) {
            formatted.stage = 'UPCOMING';
            formatted.is_active = false;
            formatted.seconds_remaining = Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000));
        } else if (now >= start && now <= end) {
            formatted.stage = 'ACTIVE';
            formatted.is_active = true;
            formatted.seconds_remaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
        } else {
            formatted.stage = 'ENDED';
            formatted.is_active = false;
            formatted.seconds_remaining = 0;
        }

        return formatted;
    }

    /**
     * Insert a new offer
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const query = `
            INSERT INTO offers (
                title, description, banner_image, phone_ids,
                regular_price, offer_price, start_date_time, end_date_time, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.title,
            data.description || null,
            data.banner_image || null,
            JSON.stringify(data.phone_ids || []),
            data.regular_price,
            data.offer_price,
            data.start_date_time,
            data.end_date_time,
            data.status || 'DRAFT'
        ];

        const [result] = await pool.execute(query, values);
        return this.findById(result.insertId);
    }

    /**
     * Find an offer by ID
     * @param {number|string} id
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        const query = `SELECT * FROM offers WHERE offer_id = ?`;
        const [rows] = await pool.execute(query, [id]);
        return rows.length > 0 ? this._formatOffer(rows[0]) : null;
    }

    /**
     * Retrieve all offers with optional filters
     * @param {Object} [filters]
     * @returns {Promise<Array>}
     */
    async findAll(filters = {}) {
        let query = `SELECT * FROM offers WHERE 1=1`;
        const values = [];

        if (filters.status) {
            query += ` AND status = ?`;
            values.push(filters.status.toUpperCase());
        }

        if (filters.stage) {
            const stageUpper = String(filters.stage).toUpperCase();
            if (stageUpper === 'DRAFT') {
                query += ` AND status = 'DRAFT'`;
            } else if (stageUpper === 'UPCOMING') {
                query += ` AND status = 'PUBLISHED' AND start_date_time > NOW()`;
            } else if (stageUpper === 'ACTIVE') {
                query += ` AND status = 'PUBLISHED' AND start_date_time <= NOW() AND end_date_time >= NOW()`;
            } else if (stageUpper === 'ENDED' || stageUpper === 'EXPIRED') {
                query += ` AND status = 'PUBLISHED' AND end_date_time < NOW()`;
            }
        }

        if (filters.search) {
            query += ` AND (title LIKE ? OR description LIKE ?)`;
            const keyword = `%${filters.search}%`;
            values.push(keyword, keyword);
        }

        query += ` ORDER BY start_date_time DESC, offer_id DESC`;

        const [rows] = await pool.execute(query, values);
        return rows.map(row => this._formatOffer(row));
    }

    /**
     * Retrieve all currently active offers (for storefront C-01 & C-12)
     * @returns {Promise<Array>}
     */
    async findActiveOffers() {
        const query = `
            SELECT * FROM offers
            WHERE status = 'PUBLISHED'
              AND start_date_time <= NOW()
              AND end_date_time >= NOW()
            ORDER BY end_date_time ASC, offer_id DESC
        `;
        const [rows] = await pool.execute(query);
        return rows.map(row => this._formatOffer(row));
    }

    /**
     * Find an active running offer for a specific phone (C-02 & C-03)
     * @param {number|string} phone_id
     * @returns {Promise<Object|null>}
     */
    async findActiveOfferByPhoneId(phone_id) {
        // Uses JSON_CONTAINS or LIKE to match numeric ID in phone_ids JSON
        const query = `
            SELECT * FROM offers
            WHERE status = 'PUBLISHED'
              AND start_date_time <= NOW()
              AND end_date_time >= NOW()
              AND (
                  JSON_CONTAINS(phone_ids, CAST(? AS JSON))
                  OR JSON_CONTAINS(phone_ids, JSON_QUOTE(CAST(? AS CHAR)))
              )
            ORDER BY offer_price ASC, end_date_time ASC
            LIMIT 1
        `;
        const [rows] = await pool.execute(query, [phone_id, phone_id]);
        return rows.length > 0 ? this._formatOffer(rows[0]) : null;
    }

    /**
     * Update an offer
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const query = `
            UPDATE offers SET
                title = ?,
                description = ?,
                banner_image = ?,
                phone_ids = ?,
                regular_price = ?,
                offer_price = ?,
                start_date_time = ?,
                end_date_time = ?,
                status = ?
            WHERE offer_id = ?
        `;

        const values = [
            data.title,
            data.description || null,
            data.banner_image || null,
            JSON.stringify(data.phone_ids || []),
            data.regular_price,
            data.offer_price,
            data.start_date_time,
            data.end_date_time,
            data.status,
            id
        ];

        await pool.execute(query, values);
        return this.findById(id);
    }

    /**
     * Delete an offer by ID
     * @param {number|string} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const query = `DELETE FROM offers WHERE offer_id = ?`;
        const [result] = await pool.execute(query, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = new OfferRepository();

