const pool = require('../config/db');

class PhoneRepository {
    /**
     * Safely parse JSON fields on a phone row
     */
    _formatPhone(row) {
        if (!row) return null;
        const jsonFields = [
            'storage_ids',
            'colour_options',
            'specification_ids',
            'accessory_ids',
            'installment_plan_ids',
            'photos'
        ];

        const formatted = { ...row };
        for (const field of jsonFields) {
            if (formatted[field] && typeof formatted[field] === 'string') {
                try {
                    formatted[field] = JSON.parse(formatted[field]);
                } catch (e) { // eslint-disable-line no-unused-vars
                    // keep raw if not valid json
                }
            }
        }
        return formatted;
    }

    /**
     * Insert a new phone record
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const query = `
            INSERT INTO phones (
                name, brand_id, phone_condition, price,
                storage_ids, colour_options, specification_ids,
                warranty, accessory_ids, description,
                stock_quantity, availability, installment_enabled,
                installment_plan_ids, status, photos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.name,
            data.brand_id,
            data.phone_condition,
            data.price,
            data.storage_ids ? JSON.stringify(data.storage_ids) : null,
            data.colour_options ? JSON.stringify(data.colour_options) : null,
            data.specification_ids ? JSON.stringify(data.specification_ids) : null,
            data.warranty || null,
            data.accessory_ids ? JSON.stringify(data.accessory_ids) : null,
            data.description || null,
            data.stock_quantity !== undefined ? data.stock_quantity : 0,
            data.availability || 'SOLD_OUT',
            data.installment_enabled ? 1 : 0,
            data.installment_plan_ids ? JSON.stringify(data.installment_plan_ids) : null,
            data.status || 'DRAFT',
            data.photos ? JSON.stringify(data.photos) : null
        ];

        const [result] = await pool.execute(query, values);
        return this.findById(result.insertId);
    }

    /**
     * Find a phone by ID with brand information joined
     * @param {number|string} phone_id
     * @returns {Promise<Object|null>}
     */
    async findById(phone_id) {
        const query = `
            SELECT 
                p.*,
                b.brand_name
            FROM phones p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE p.phone_id = ?
        `;
        const [rows] = await pool.execute(query, [phone_id]);
        return rows.length > 0 ? this._formatPhone(rows[0]) : null;
    }

    /**
     * Get all phones with optional filtering
     * @param {Object} [filters]
     * @returns {Promise<Array>}
     */
    async findAll(filters = {}) {
        let query = `
            SELECT 
                p.*,
                b.brand_name
            FROM phones p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE 1=1
        `;
        const values = [];

        if (filters.brand_id) {
            query += ` AND p.brand_id = ?`;
            values.push(filters.brand_id);
        }
        if (filters.status) {
            query += ` AND p.status = ?`;
            values.push(filters.status);
        }
        if (filters.phone_condition) {
            query += ` AND p.phone_condition = ?`;
            values.push(filters.phone_condition);
        }
        if (filters.availability) {
            query += ` AND p.availability = ?`;
            values.push(filters.availability);
        }
        if (filters.search) {
            query += ` AND (p.name LIKE ? OR b.brand_name LIKE ?)`;
            const keyword = `%${filters.search}%`;
            values.push(keyword, keyword);
        }

        query += ` ORDER BY p.phone_id DESC`;

        const [rows] = await pool.execute(query, values);
        return rows.map(row => this._formatPhone(row));
    }

    /**
     * Update an existing phone record
     * @param {number|string} phone_id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(phone_id, data) {
        const query = `
            UPDATE phones SET
                name = ?,
                brand_id = ?,
                phone_condition = ?,
                price = ?,
                storage_ids = ?,
                colour_options = ?,
                specification_ids = ?,
                warranty = ?,
                accessory_ids = ?,
                description = ?,
                stock_quantity = ?,
                availability = ?,
                installment_enabled = ?,
                installment_plan_ids = ?,
                status = ?,
                photos = ?
            WHERE phone_id = ?
        `;

        const values = [
            data.name,
            data.brand_id,
            data.phone_condition,
            data.price,
            data.storage_ids ? JSON.stringify(data.storage_ids) : null,
            data.colour_options ? JSON.stringify(data.colour_options) : null,
            data.specification_ids ? JSON.stringify(data.specification_ids) : null,
            data.warranty || null,
            data.accessory_ids ? JSON.stringify(data.accessory_ids) : null,
            data.description || null,
            data.stock_quantity !== undefined ? data.stock_quantity : 0,
            data.availability,
            data.installment_enabled ? 1 : 0,
            data.installment_plan_ids ? JSON.stringify(data.installment_plan_ids) : null,
            data.status,
            data.photos ? JSON.stringify(data.photos) : null,
            phone_id
        ];

        await pool.execute(query, values);
        return this.findById(phone_id);
    }

    /**
     * Delete a phone by ID
     * @param {number|string} phone_id
     * @returns {Promise<boolean>}
     */
    async delete(phone_id) {
        const query = `DELETE FROM phones WHERE phone_id = ?`;
        const [result] = await pool.execute(query, [phone_id]);
        return result.affectedRows > 0;
    }
}

module.exports = new PhoneRepository();
