const pool = require('../config/db');

class SpecificationRepository {
    /**
     * Insert a new specification
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create({ specification_name, specification_type, description, is_active }) {
        const query = `
            INSERT INTO specifications (specification_name, specification_type, description, is_active)
            VALUES (?, ?, ?, ?)
        `;
        const values = [specification_name, specification_type, description, is_active];
        const [result] = await pool.execute(query, values);

        return this.findById(result.insertId);
    }

    /**
     * Find a specification by ID
     * @param {number|string} specification_id
     * @returns {Promise<Object|null>}
     */
    async findById(specification_id) {
        const query = `
            SELECT specification_id, specification_name, specification_type, description, is_active, created_at
            FROM specifications
            WHERE specification_id = ?
        `;
        const [rows] = await pool.execute(query, [specification_id]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Find specifications by multiple IDs
     * @param {Array<number|string>} ids
     * @returns {Promise<Array>}
     */
    async findByIds(ids) {
        if (!Array.isArray(ids) || ids.length === 0) return [];
        const cleanIds = ids.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
        if (cleanIds.length === 0) return [];
        const placeholders = cleanIds.map(() => '?').join(',');
        const query = `
            SELECT specification_id, specification_name, specification_type, description, is_active, created_at
            FROM specifications
            WHERE specification_id IN (${placeholders})
            ORDER BY specification_type ASC, specification_name ASC
        `;
        const [rows] = await pool.execute(query, cleanIds);
        return rows;
    }

    /**
     * Find a specification by name and type
     * @param {string} specification_name
     * @param {string} specification_type
     * @returns {Promise<Object|null>}
     */
    async findByNameAndType(specification_name, specification_type) {
        const query = `
            SELECT specification_id, specification_name, specification_type, description, is_active, created_at
            FROM specifications
            WHERE LOWER(specification_name) = LOWER(?) AND specification_type = ?
        `;
        const [rows] = await pool.execute(query, [specification_name, specification_type]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get all specifications (optionally filtered by type)
     * @param {string} [type]
     * @returns {Promise<Array>}
     */
    async findAll(type) {
        let query = `
            SELECT specification_id, specification_name, specification_type, description, is_active, created_at
            FROM specifications
        `;
        const values = [];

        if (type) {
            query += ` WHERE specification_type = ?`;
            values.push(type);
        }

        query += ` ORDER BY specification_id DESC`;
        const [rows] = await pool.execute(query, values);
        return rows;
    }

    /**
     * Update an existing specification
     * @param {number|string} specification_id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(specification_id, { specification_name, specification_type, description, is_active }) {
        const query = `
            UPDATE specifications
            SET specification_name = ?, specification_type = ?, description = ?, is_active = ?
            WHERE specification_id = ?
        `;
        const values = [specification_name, specification_type, description, is_active, specification_id];
        await pool.execute(query, values);

        return this.findById(specification_id);
    }

    /**
     * Delete a specification by ID
     * @param {number|string} specification_id
     * @returns {Promise<boolean>}
     */
    async delete(specification_id) {
        const query = `DELETE FROM specifications WHERE specification_id = ?`;
        const [result] = await pool.execute(query, [specification_id]);
        return result.affectedRows > 0;
    }
}

module.exports = new SpecificationRepository();
