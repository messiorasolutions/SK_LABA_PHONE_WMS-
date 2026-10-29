const defaultPool = require('../config/db');

class SellRequestRepository {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Safely parse JSON fields (photos)
     */
    _parseJson(val) {
        if (!val) return null;
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            } catch {
                return val;
            }
        }
        return val;
    }

    /**
     * Format raw database sell_request row into structured domain object
     */
    _formatSellRequest(row) {
        if (!row) return null;

        const formatted = {
            request_id: row.request_id,
            customer_name: row.customer_name,
            phone_number: row.phone_number,
            brand_and_model: row.brand_and_model,
            brand: row.brand || null,
            model: row.model || null,
            storage_capacity: row.storage_capacity,
            phone_condition: row.phone_condition,
            battery_health: row.battery_health,
            description: row.description || null,
            photos: this._parseJson(row.photos),
            desired_phone_id: row.desired_phone_id || null,
            status: row.status,
            assigned_to_user_id: row.assigned_to_user_id || null,
            assigned_staff: row.assigned_to_user_id ? {
                user_id: row.assigned_to_user_id,
                display_name: row.assigned_staff_name || null,
                email: row.assigned_staff_email || null
            } : null,
            updated_by_user_id: row.updated_by_user_id || null,
            updated_by_staff: row.updated_by_user_id ? {
                user_id: row.updated_by_user_id,
                display_name: row.updated_by_staff_name || null,
                email: row.updated_by_staff_email || null
            } : null,
            desired_phone: row.desired_phone_id ? {
                phone_id: row.desired_phone_id,
                name: row.desired_phone_name || null,
                price: row.desired_phone_price !== null && row.desired_phone_price !== undefined ? Number(row.desired_phone_price) : null,
                brand_name: row.desired_phone_brand_name || null,
                availability: row.desired_phone_availability || null,
                status: row.desired_phone_status || null,
                phone_condition: row.desired_phone_condition || null,
                photos: this._parseJson(row.desired_phone_photos)
            } : null,
            created_at: row.created_at,
            updated_at: row.updated_at
        };

        return formatted;
    }

    /**
     * Insert a new sell-your-phone request 
     */
    async create(
        {
            customer_name,
            phone_number,
            brand_and_model,
            brand = null,
            model = null,
            storage_capacity,
            phone_condition,
            battery_health,
            description = null,
            photos = null,
            desired_phone_id = null
        },
        executor = this.pool
    ) {
        const query = `
            INSERT INTO sell_requests (
                customer_name,
                phone_number,
                brand_and_model,
                brand,
                model,
                storage_capacity,
                phone_condition,
                battery_health,
                description,
                photos,
                desired_phone_id,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')
        `;

        const values = [
            customer_name.trim(),
            phone_number.trim(),
            brand_and_model.trim(),
            brand ? brand.trim() : null,
            model ? model.trim() : null,
            storage_capacity.trim(),
            phone_condition.trim(),
            battery_health.trim(),
            description ? description.trim() : null,
            photos ? JSON.stringify(photos) : null,
            desired_phone_id ? Number(desired_phone_id) : null
        ];

        const [result] = await executor.execute(query, values);
        return await this.findById(result.insertId, executor);
    }

    /**
     * Find a sell request by ID with desired phone, brand, and staff associations
     */
    async findById(requestId, executor = this.pool) {
        const query = `
            SELECT 
                sr.request_id,
                sr.customer_name,
                sr.phone_number,
                sr.brand_and_model,
                sr.brand,
                sr.model,
                sr.storage_capacity,
                sr.phone_condition,
                sr.battery_health,
                sr.description,
                sr.photos,
                sr.desired_phone_id,
                sr.status,
                sr.assigned_to_user_id,
                sr.updated_by_user_id,
                sr.created_at,
                sr.updated_at,
                p.name AS desired_phone_name,
                p.price AS desired_phone_price,
                p.availability AS desired_phone_availability,
                p.status AS desired_phone_status,
                p.phone_condition AS desired_phone_condition,
                p.photos AS desired_phone_photos,
                b.brand_name AS desired_phone_brand_name,
                u_assigned.display_name AS assigned_staff_name,
                u_assigned.email AS assigned_staff_email,
                u_updated.display_name AS updated_by_staff_name,
                u_updated.email AS updated_by_staff_email
            FROM sell_requests sr
            LEFT JOIN phones p ON sr.desired_phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN dashboard_users u_assigned ON sr.assigned_to_user_id = u_assigned.user_id
            LEFT JOIN dashboard_users u_updated ON sr.updated_by_user_id = u_updated.user_id
            WHERE sr.request_id = ?
        `;

        const [rows] = await executor.execute(query, [requestId]);
        return rows.length > 0 ? this._formatSellRequest(rows[0]) : null;
    }

    /**
     * List sell requests with pagination, searching, and filtering 
     */
    async findSellRequests(
        {
            page = 1,
            limit = 10,
            search,
            status,
            desired_phone_id,
            assigned_to_user_id,
            from_date,
            to_date
        } = {},
        executor = this.pool
    ) {
        const conditions = [];
        const params = [];

        if (search && typeof search === 'string' && search.trim().length > 0) {
            const searchTerm = `%${search.trim()}%`;
            conditions.push('(sr.customer_name LIKE ? OR sr.phone_number LIKE ? OR sr.brand_and_model LIKE ? OR sr.brand LIKE ? OR sr.model LIKE ?)');
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status && typeof status === 'string' && status.trim().length > 0) {
            conditions.push('sr.status = ?');
            params.push(status.trim());
        }

        if (desired_phone_id !== undefined && desired_phone_id !== null && desired_phone_id !== '') {
            conditions.push('sr.desired_phone_id = ?');
            params.push(Number(desired_phone_id));
        }

        if (assigned_to_user_id !== undefined && assigned_to_user_id !== null && assigned_to_user_id !== '') {
            conditions.push('sr.assigned_to_user_id = ?');
            params.push(Number(assigned_to_user_id));
        }

        if (from_date && typeof from_date === 'string' && from_date.trim().length > 0) {
            conditions.push('sr.created_at >= ?');
            params.push(`${from_date.trim()} 00:00:00`);
        }

        if (to_date && typeof to_date === 'string' && to_date.trim().length > 0) {
            conditions.push('sr.created_at <= ?');
            params.push(`${to_date.trim()} 23:59:59`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. Total count query
        const countQuery = `SELECT COUNT(*) AS total FROM sell_requests sr ${whereClause}`;
        const [countRows] = await executor.execute(countQuery, params);
        const total = countRows[0] ? Number(countRows[0].total) : 0;

        // 2. Pagination calculation
        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (safePage - 1) * safeLimit;
        const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

        // 3. Paginated rows query
        const dataQuery = `
            SELECT 
                sr.request_id,
                sr.customer_name,
                sr.phone_number,
                sr.brand_and_model,
                sr.brand,
                sr.model,
                sr.storage_capacity,
                sr.phone_condition,
                sr.battery_health,
                sr.description,
                sr.photos,
                sr.desired_phone_id,
                sr.status,
                sr.assigned_to_user_id,
                sr.updated_by_user_id,
                sr.created_at,
                sr.updated_at,
                p.name AS desired_phone_name,
                p.price AS desired_phone_price,
                p.availability AS desired_phone_availability,
                p.status AS desired_phone_status,
                p.phone_condition AS desired_phone_condition,
                p.photos AS desired_phone_photos,
                b.brand_name AS desired_phone_brand_name,
                u_assigned.display_name AS assigned_staff_name,
                u_assigned.email AS assigned_staff_email,
                u_updated.display_name AS updated_by_staff_name,
                u_updated.email AS updated_by_staff_email
            FROM sell_requests sr
            LEFT JOIN phones p ON sr.desired_phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN dashboard_users u_assigned ON sr.assigned_to_user_id = u_assigned.user_id
            LEFT JOIN dashboard_users u_updated ON sr.updated_by_user_id = u_updated.user_id
            ${whereClause}
            ORDER BY sr.created_at DESC, sr.request_id DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await executor.execute(dataQuery, [...params, safeLimit, offset]);

        return {
            requests: rows.map((row) => this._formatSellRequest(row)),
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages
            }
        };
    }

    /**
     * Update sell request status and staff audit attribution 
     */
    async updateStatus(
        requestId,
        { status, updated_by_user_id, assigned_to_user_id },
        executor = this.pool
    ) {
        const updateFields = ['status = ?', 'updated_by_user_id = ?'];
        const updateValues = [status, Number(updated_by_user_id)];

        if (assigned_to_user_id !== undefined) {
            updateFields.push('assigned_to_user_id = ?');
            updateValues.push(assigned_to_user_id !== null ? Number(assigned_to_user_id) : null);
        }

        updateValues.push(Number(requestId));

        const query = `
            UPDATE sell_requests
            SET ${updateFields.join(', ')}
            WHERE request_id = ?
        `;

        await executor.execute(query, updateValues);
        return await this.findById(requestId, executor);
    }

    /**
     * Update assigned staff member on a sell request
     */
    async updateAssignment(
        requestId,
        { assigned_to_user_id, updated_by_user_id },
        executor = this.pool
    ) {
        const query = `
            UPDATE sell_requests
            SET assigned_to_user_id = ?, updated_by_user_id = ?
            WHERE request_id = ?
        `;

        const values = [
            assigned_to_user_id !== null ? Number(assigned_to_user_id) : null,
            Number(updated_by_user_id),
            Number(requestId)
        ];

        await executor.execute(query, values);
        return await this.findById(requestId, executor);
    }
}

const defaultSellRequestRepository = new SellRequestRepository();

module.exports = defaultSellRequestRepository;
module.exports.SellRequestRepository = SellRequestRepository;
