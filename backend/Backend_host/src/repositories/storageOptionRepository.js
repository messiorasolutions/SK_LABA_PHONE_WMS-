const pool = require('../config/db');

class StorageOptionRepository {
    /**
     * Insert a new storage option
     * @param {Object} data
     * @param {string} data.storage_name
     * @param {number} data.capacity_gb
     * @returns {Promise<Object>}
     */
    async create({ storage_name, capacity_gb }) {
        const query = `
            INSERT INTO storage_options (storage_name, capacity_gb)
            VALUES (?, ?)
        `;
        const values = [storage_name, capacity_gb];
        const [result] = await pool.execute(query, values);

        return this.findById(result.insertId);
    }

    /**
     * Find storage option by ID
     * @param {number|string} storage_id
     * @returns {Promise<Object|null>}
     */
    async findById(storage_id) {
        const query = `
            SELECT storage_id, storage_name, capacity_gb, created_at
            FROM storage_options
            WHERE storage_id = ?
        `;
        const [rows] = await pool.execute(query, [storage_id]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Find storage option by name
     * @param {string} storage_name
     * @returns {Promise<Object|null>}
     */
    async findByName(storage_name) {
        const query = `
            SELECT storage_id, storage_name, capacity_gb, created_at
            FROM storage_options
            WHERE LOWER(storage_name) = LOWER(?)
        `;
        const [rows] = await pool.execute(query, [storage_name]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get all storage options ordered by capacity
     * @returns {Promise<Array>}
     */
    async findAll() {
        const query = `
            SELECT storage_id, storage_name, capacity_gb, created_at
            FROM storage_options
            ORDER BY capacity_gb ASC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    /**
     * Update an existing storage option
     * @param {number|string} storage_id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(storage_id, { storage_name, capacity_gb }) {
        const query = `
            UPDATE storage_options
            SET storage_name = ?, capacity_gb = ?
            WHERE storage_id = ?
        `;
        const values = [storage_name, capacity_gb, storage_id];
        await pool.execute(query, values);

        return this.findById(storage_id);
    }

    /**
     * Delete a storage option by ID
     * @param {number|string} storage_id
     * @returns {Promise<boolean>}
     */
    async delete(storage_id) {
        const query = `DELETE FROM storage_options WHERE storage_id = ?`;
        const [result] = await pool.execute(query, [storage_id]);
        return result.affectedRows > 0;
    }
}

module.exports = new StorageOptionRepository();
