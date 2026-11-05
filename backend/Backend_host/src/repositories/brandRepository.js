const pool = require('../config/db');

class BrandRepository {
    /**
     * Insert a new brand into the database
     * @param {Object} brandData
     * @param {string} brandData.brand_name
     * @param {string|null} brandData.description
     * @param {boolean} brandData.is_active
     * @returns {Promise<Object>} Created brand object
     */
    async create({ brand_name, description, is_active }) {
        const query = `
            INSERT INTO brands (brand_name, description, is_active)
            VALUES (?, ?, ?)
        `;
        const values = [brand_name, description, is_active];
        const [result] = await pool.execute(query, values);

        return this.findById(result.insertId);
    }

    /**
     * Find a brand by ID
     * @param {number|string} brand_id
     * @returns {Promise<Object|null>}
     */
    async findById(brand_id) {
        const query = `
            SELECT brand_id, brand_name, description, is_active, created_at, updated_at
            FROM brands
            WHERE brand_id = ?
        `;
        const [rows] = await pool.execute(query, [brand_id]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Find a brand by exact name
     * @param {string} brand_name
     * @returns {Promise<Object|null>}
     */
    async findByName(brand_name) {
        const query = `
            SELECT brand_id, brand_name, description, is_active, created_at, updated_at
            FROM brands
            WHERE LOWER(brand_name) = LOWER(?)
        `;
        const [rows] = await pool.execute(query, [brand_name]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get all brands
     * @returns {Promise<Array>}
     */
    async findAll() {
        const query = `
            SELECT brand_id, brand_name, description, is_active, created_at, updated_at
            FROM brands
            ORDER BY brand_id DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    /**
     * Update an existing brand
     * @param {number|string} brand_id
     * @param {Object} updateData
     * @param {string} updateData.brand_name
     * @param {string|null} updateData.description
     * @param {boolean} updateData.is_active
     * @returns {Promise<Object|null>}
     */
    async update(brand_id, { brand_name, description, is_active }) {
        const query = `
            UPDATE brands
            SET brand_name = ?, description = ?, is_active = ?
            WHERE brand_id = ?
        `;
        const values = [brand_name, description, is_active, brand_id];
        await pool.execute(query, values);

        return this.findById(brand_id);
    }

    /**
     * Delete a brand by ID
     * @param {number|string} brand_id
     * @returns {Promise<boolean>}
     */
    async delete(brand_id) {
        const query = `DELETE FROM brands WHERE brand_id = ?`;
        const [result] = await pool.execute(query, [brand_id]);
        return result.affectedRows > 0;
    }
}

module.exports = new BrandRepository();
