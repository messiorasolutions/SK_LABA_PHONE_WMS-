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

        formatted.current_stock = Number(formatted.current_stock ?? 0);
        formatted.low_stock_level = Number(formatted.low_stock_level ?? 5);
        formatted.stock = formatted.current_stock;
        formatted.stock_quantity = formatted.current_stock;
        formatted.is_archived = Boolean(formatted.is_archived || formatted.status === 'ARCHIVED');
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
                low_stock_level, current_stock, availability, installment_enabled,
                installment_plan_ids, status, is_archived, photos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            data.low_stock_level !== undefined ? data.low_stock_level : 5,
            data.current_stock !== undefined ? data.current_stock : 0,
            data.availability || 'SOLD_OUT',
            data.installment_enabled ? 1 : 0,
            data.installment_plan_ids ? JSON.stringify(data.installment_plan_ids) : null,
            data.status || 'DRAFT',
            data.is_archived ? 1 : 0,
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
     * Defaults to non-archived phones unless archived is explicitly requested
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

        const isArchiveRequested =
            filters.archived === true ||
            filters.archived === 'true' ||
            filters.archived === 'yes' ||
            filters.archived === '1' ||
            filters.is_archived === true ||
            filters.is_archived === 'true' ||
            filters.is_archived === 'yes' ||
            filters.is_archived === '1' ||
            filters.status === 'ARCHIVED';

        const isIncludeAllRequested =
            filters.archived === 'all' ||
            filters.include_archived === true ||
            filters.include_archived === 'true' ||
            filters.status === 'ALL';

        if (isArchiveRequested) {
            query += ` AND (p.is_archived = 1 OR p.status = 'ARCHIVED')`;
        } else if (!isIncludeAllRequested) {
            // Normal list: hide archived phones
            query += ` AND p.is_archived = 0 AND p.status != 'ARCHIVED'`;
        }

        if (filters.brand_id) {
            query += ` AND p.brand_id = ?`;
            values.push(filters.brand_id);
        }
        if (filters.status && filters.status !== 'ARCHIVED' && filters.status !== 'ALL') {
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
     * Get stock list with stock-specific filters
     * @param {Object} [filters]
     * @returns {Promise<Array>}
     */
    async findAllStock(filters = {}) {
        let query = `
            SELECT 
                p.*,
                b.brand_name
            FROM phones p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE 1=1
        `;
        const values = [];

        const isArchiveRequested =
            filters.archived === true ||
            filters.archived === 'true' ||
            filters.archived === 'yes' ||
            filters.archived === '1' ||
            filters.is_archived === true ||
            filters.is_archived === 'true' ||
            filters.is_archived === 'yes' ||
            filters.is_archived === '1';

        const isIncludeAllRequested =
            filters.archived === 'all' ||
            filters.include_archived === true ||
            filters.include_archived === 'true';

        if (isArchiveRequested) {
            query += ` AND (p.is_archived = 1 OR p.status = 'ARCHIVED')`;
        } else if (!isIncludeAllRequested) {
            query += ` AND p.is_archived = 0 AND p.status != 'ARCHIVED'`;
        }

        if (filters.brand_id) {
            query += ` AND p.brand_id = ?`;
            values.push(filters.brand_id);
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

        // Stock status filter
        if (filters.stock_status) {
            const statusLower = String(filters.stock_status).toLowerCase();
            if (statusLower === 'low' || statusLower === 'low_stock') {
                query += ` AND p.current_stock <= p.low_stock_level AND p.current_stock > 0`;
            } else if (statusLower === 'out' || statusLower === 'sold_out' || statusLower === 'out_of_stock') {
                query += ` AND (p.current_stock = 0 OR p.availability = 'SOLD_OUT')`;
            } else if (statusLower === 'in_stock') {
                query += ` AND p.current_stock > 0 AND p.availability = 'IN_STOCK'`;
            }
        }

        query += ` ORDER BY p.phone_id DESC`;

        const [rows] = await pool.execute(query, values);
        return rows.map(row => this._formatPhone(row));
    }

    /**
     * Add stock quantity to a phone
     * @param {number|string} phone_id
     * @param {number} quantity
     * @param {string} newAvailability
     * @returns {Promise<Object>}
     */
    async addStock(phone_id, quantity, newAvailability) {
        const query = `
            UPDATE phones 
            SET current_stock = current_stock + ?,
                availability = ?
            WHERE phone_id = ?
        `;
        await pool.execute(query, [quantity, newAvailability, phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Deduct stock quantity from a phone
     * @param {number|string} phone_id
     * @param {number} quantity
     * @param {string} newAvailability
     * @returns {Promise<Object>}
     */
    async removeStock(phone_id, quantity, newAvailability) {
        const query = `
            UPDATE phones 
            SET current_stock = GREATEST(0, CAST(current_stock AS SIGNED) - ?),
                availability = ?
            WHERE phone_id = ?
        `;
        await pool.execute(query, [quantity, newAvailability, phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Mark a phone as SOLD_OUT
     * @param {number|string} phone_id
     * @param {boolean} [resetQuantity=false]
     * @returns {Promise<Object>}
     */
    async markSoldOut(phone_id, resetQuantity = false) {
        const query = resetQuantity
            ? `UPDATE phones SET availability = 'SOLD_OUT', current_stock = 0 WHERE phone_id = ?`
            : `UPDATE phones SET availability = 'SOLD_OUT' WHERE phone_id = ?`;
        await pool.execute(query, [phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Archive a phone by ID
     * @param {number|string} phone_id
     * @returns {Promise<Object>}
     */
    async archive(phone_id) {
        const query = `UPDATE phones SET is_archived = 1, status = 'ARCHIVED' WHERE phone_id = ?`;
        await pool.execute(query, [phone_id]);
        return this.findById(phone_id);
    }

    /**
     * Restore an archived phone by ID
     * @param {number|string} phone_id
     * @param {string} [restoreStatus='DRAFT']
     * @returns {Promise<Object>}
     */
    async restore(phone_id, restoreStatus = 'DRAFT') {
        const cleanStatus = ['PUBLISHED', 'DRAFT'].includes(String(restoreStatus).toUpperCase())
            ? String(restoreStatus).toUpperCase()
            : 'DRAFT';
        const query = `UPDATE phones SET is_archived = 0, status = ? WHERE phone_id = ?`;
        await pool.execute(query, [cleanStatus, phone_id]);
        return this.findById(phone_id);
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
                low_stock_level = ?,
                current_stock = ?,
                availability = ?,
                installment_enabled = ?,
                installment_plan_ids = ?,
                status = ?,
                is_archived = ?,
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
            data.low_stock_level !== undefined ? data.low_stock_level : 5,
            data.current_stock !== undefined ? data.current_stock : 0,
            data.availability,
            data.installment_enabled ? 1 : 0,
            data.installment_plan_ids ? JSON.stringify(data.installment_plan_ids) : null,
            data.status,
            data.is_archived ? 1 : 0,
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
