const pool = require('../config/db');

class InstallmentPlanRepository {
    /**
     * Format raw database row
     */
    _formatPlan(row) {
        if (!row) return null;
        return {
            installment_plan_id: Number(row.installment_plan_id),
            plan_name: row.plan_name,
            number_of_months: Number(row.number_of_months),
            interest_rate: Number(row.interest_rate),
            additional_fee: Number(row.additional_fee),
            terms: row.terms,
            is_active: Boolean(row.is_active),
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    /**
     * Insert a new installment plan
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const query = `
            INSERT INTO installment_plans (
                plan_name, number_of_months, interest_rate, additional_fee, terms, is_active
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.plan_name,
            data.number_of_months,
            data.interest_rate !== undefined ? data.interest_rate : 0.00,
            data.additional_fee !== undefined ? data.additional_fee : 0.00,
            data.terms || null,
            data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
        ];

        const [result] = await pool.execute(query, values);
        return this.findById(result.insertId);
    }

    /**
     * Find an installment plan by ID
     * @param {number|string} id
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        const query = `SELECT * FROM installment_plans WHERE installment_plan_id = ?`;
        const [rows] = await pool.execute(query, [id]);
        return rows.length > 0 ? this._formatPlan(rows[0]) : null;
    }

    /**
     * Find an installment plan by exact name
     * @param {string} name
     * @returns {Promise<Object|null>}
     */
    async findByName(name) {
        const query = `SELECT * FROM installment_plans WHERE LOWER(plan_name) = LOWER(?) LIMIT 1`;
        const [rows] = await pool.execute(query, [name.trim()]);
        return rows.length > 0 ? this._formatPlan(rows[0]) : null;
    }

    /**
     * Retrieve all installment plans with optional filters
     * @param {Object} [filters]
     * @returns {Promise<Array>}
     */
    async findAll(filters = {}) {
        let query = `SELECT * FROM installment_plans WHERE 1=1`;
        const values = [];

        if (filters.is_active !== undefined && filters.is_active !== null && filters.is_active !== '') {
            const isActiveBool = filters.is_active === true || filters.is_active === 'true' || filters.is_active === 1 || filters.is_active === '1';
            query += ` AND is_active = ?`;
            values.push(isActiveBool ? 1 : 0);
        }

        if (filters.search) {
            query += ` AND (plan_name LIKE ? OR terms LIKE ?)`;
            const keyword = `%${filters.search}%`;
            values.push(keyword, keyword);
        }

        query += ` ORDER BY number_of_months ASC, installment_plan_id ASC`;

        const [rows] = await pool.execute(query, values);
        return rows.map(row => this._formatPlan(row));
    }

    /**
     * Retrieve plans by list of IDs
     * @param {Array<number>} ids
     * @param {boolean} [onlyActive=true]
     * @returns {Promise<Array>}
     */
    async findByIds(ids = [], onlyActive = true) {
        if (!Array.isArray(ids) || ids.length === 0) return [];
        const placeholders = ids.map(() => '?').join(',');
        let query = `SELECT * FROM installment_plans WHERE installment_plan_id IN (${placeholders})`;
        const values = [...ids];

        if (onlyActive) {
            query += ` AND is_active = 1`;
        }
        query += ` ORDER BY number_of_months ASC`;

        const [rows] = await pool.execute(query, values);
        return rows.map(row => this._formatPlan(row));
    }

    /**
     * Update an installment plan
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const query = `
            UPDATE installment_plans SET
                plan_name = ?,
                number_of_months = ?,
                interest_rate = ?,
                additional_fee = ?,
                terms = ?,
                is_active = ?
            WHERE installment_plan_id = ?
        `;

        const values = [
            data.plan_name,
            data.number_of_months,
            data.interest_rate,
            data.additional_fee,
            data.terms || null,
            data.is_active ? 1 : 0,
            id
        ];

        await pool.execute(query, values);
        return this.findById(id);
    }

    /**
     * Toggle active/inactive status
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async toggleStatus(id) {
        const query = `UPDATE installment_plans SET is_active = NOT is_active WHERE installment_plan_id = ?`;
        await pool.execute(query, [id]);
        return this.findById(id);
    }

    /**
     * Delete an installment plan by ID
     * @param {number|string} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const query = `DELETE FROM installment_plans WHERE installment_plan_id = ?`;
        const [result] = await pool.execute(query, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = new InstallmentPlanRepository();

