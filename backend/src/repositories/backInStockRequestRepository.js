const defaultPool = require('../config/db');

class BackInStockRequestRepository {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Safely parse JSON fields (e.g. photos on joined phone)
     */
    _parsePhotos(photos) {
        if (!photos) return null;
        if (typeof photos === 'string') {
            try {
                return JSON.parse(photos);
            } catch {
                return photos;
            }
        }
        return photos;
    }

    /**
     * Format raw database back-in-stock request row into structured domain object
     */
    _formatRequest(row) {
        if (!row) return null;

        const formatted = {
            request_id: row.request_id,
            phone_id: row.phone_id,
            customer_name: row.customer_name,
            name: row.customer_name, // convenient alias
            phone_number: row.phone_number,
            whatsapp_number: row.phone_number, // convenient alias
            email: row.email || null,
            status: row.status,
            notes: row.notes || null,
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
            contacted_at: row.contacted_at || null,
            created_at: row.created_at,
            updated_at: row.updated_at,
            phone: row.phone_id ? {
                phone_id: row.phone_id,
                name: row.phone_name || null,
                price: row.phone_price !== null && row.phone_price !== undefined ? Number(row.phone_price) : null,
                brand_id: row.phone_brand_id || null,
                brand_name: row.phone_brand_name || null,
                availability: row.phone_availability || null,
                current_stock: row.phone_current_stock !== null && row.phone_current_stock !== undefined ? Number(row.phone_current_stock) : 0,
                status: row.phone_status || null,
                phone_condition: row.phone_condition || null,
                photos: this._parsePhotos(row.phone_photos)
            } : null
        };

        return formatted;
    }

    /**
     * Insert a new back-in-stock request record
     * @param {Object} data
     * @param {number} data.phone_id
     * @param {string} data.customer_name
     * @param {string} data.phone_number
     * @param {string|null} [data.email]
     * @param {string} [data.status='Pending']
     * @param {string|null} [data.notes]
     * @param {Object} [executor]
     * @returns {Promise<Object>} Formatted request record
     */
    async create(data, executor = this.pool) {
        const {
            phone_id,
            customer_name,
            phone_number,
            email = null,
            status = 'Pending',
            notes = null
        } = data;

        const query = `
            INSERT INTO back_in_stock_requests (
                phone_id,
                customer_name,
                phone_number,
                email,
                status,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
            Number(phone_id),
            customer_name.trim(),
            phone_number.trim(),
            email ? email.trim().toLowerCase() : null,
            status,
            notes ? notes.trim() : null
        ];

        const [result] = await executor.execute(query, values);
        return await this.findById(result.insertId, executor);
    }

    /**
     * Retrieve complete details of an individual request by ID
     * @param {number|string} requestId
     * @param {Object} [executor]
     * @returns {Promise<Object|null>} Formatted request record or null
     */
    async findById(requestId, executor = this.pool) {
        const query = `
            SELECT 
                r.request_id,
                r.phone_id,
                r.customer_name,
                r.phone_number,
                r.email,
                r.status,
                r.notes,
                r.assigned_to_user_id,
                r.updated_by_user_id,
                r.contacted_at,
                r.created_at,
                r.updated_at,
                p.name AS phone_name,
                p.price AS phone_price,
                p.brand_id AS phone_brand_id,
                p.availability AS phone_availability,
                p.current_stock AS phone_current_stock,
                p.status AS phone_status,
                p.phone_condition AS phone_condition,
                p.photos AS phone_photos,
                b.brand_name AS phone_brand_name,
                u_assigned.display_name AS assigned_staff_name,
                u_assigned.email AS assigned_staff_email,
                u_updated.display_name AS updated_by_staff_name,
                u_updated.email AS updated_by_staff_email
            FROM back_in_stock_requests r
            LEFT JOIN phones p ON r.phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN dashboard_users u_assigned ON r.assigned_to_user_id = u_assigned.user_id
            LEFT JOIN dashboard_users u_updated ON r.updated_by_user_id = u_updated.user_id
            WHERE r.request_id = ?
        `;

        const [rows] = await executor.execute(query, [requestId]);
        return rows.length > 0 ? this._formatRequest(rows[0]) : null;
    }

    /**
     * Check if a pending request already exists for the given phone_id and phone_number
     * @param {number|string} phoneId
     * @param {string} phoneNumber
     * @param {Object} [executor]
     * @returns {Promise<Object|null>}
     */
    async findPendingByPhoneAndNumber(phoneId, phoneNumber, executor = this.pool) {
        const query = `
            SELECT request_id, phone_id, customer_name, phone_number, email, status, created_at
            FROM back_in_stock_requests
            WHERE phone_id = ? AND phone_number = ? AND status = 'Pending'
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const [rows] = await executor.execute(query, [phoneId, phoneNumber.trim()]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Count waiting (Pending) customers for a specific phone at the database level
     * @param {number|string} phoneId
     * @param {Object} [executor]
     * @returns {Promise<number>}
     */
    async countWaitingByPhoneId(phoneId, executor = this.pool) {
        const query = `
            SELECT COUNT(DISTINCT phone_number) AS waiting_count
            FROM back_in_stock_requests
            WHERE phone_id = ? AND status = 'Pending'
        `;
        const [rows] = await executor.execute(query, [phoneId]);
        return rows[0] ? Number(rows[0].waiting_count || 0) : 0;
    }

    /**
     * List all waiting requests for a specific phone
     * @param {number|string} phoneId
     * @param {string} [status='Pending']
     * @param {Object} [executor]
     * @returns {Promise<Array>}
     */
    async findByPhoneId(phoneId, status = 'Pending', executor = this.pool) {
        let query = `
            SELECT 
                r.request_id,
                r.phone_id,
                r.customer_name,
                r.phone_number,
                r.email,
                r.status,
                r.notes,
                r.assigned_to_user_id,
                r.updated_by_user_id,
                r.contacted_at,
                r.created_at,
                r.updated_at,
                u_assigned.display_name AS assigned_staff_name,
                u_assigned.email AS assigned_staff_email
            FROM back_in_stock_requests r
            LEFT JOIN dashboard_users u_assigned ON r.assigned_to_user_id = u_assigned.user_id
            WHERE r.phone_id = ?
        `;
        const params = [phoneId];

        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.created_at ASC';

        const [rows] = await executor.execute(query, params);
        return rows.map(r => ({
            request_id: r.request_id,
            phone_id: r.phone_id,
            customer_name: r.customer_name,
            phone_number: r.phone_number,
            email: r.email,
            status: r.status,
            notes: r.notes,
            assigned_to_user_id: r.assigned_to_user_id,
            assigned_staff_name: r.assigned_staff_name || null,
            contacted_at: r.contacted_at,
            created_at: r.created_at,
            updated_at: r.updated_at
        }));
    }

    /**
     * List back-in-stock requests grouped by phone with waiting counts
     * @param {Object} [options]
     * @param {string} [options.search]
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @param {Object} [executor]
     * @returns {Promise<{ phones: Array, pagination: Object }>}
     */
    async findRequestsGroupedByPhone({ search, page = 1, limit = 10 } = {}, executor = this.pool) {
        const conditions = [];
        const params = [];

        if (search && typeof search === 'string' && search.trim().length > 0) {
            const searchTerm = `%${search.trim()}%`;
            conditions.push('(p.name LIKE ? OR b.brand_name LIKE ?)');
            params.push(searchTerm, searchTerm);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. Total distinct phones count
        const countQuery = `
            SELECT COUNT(DISTINCT r.phone_id) AS total
            FROM back_in_stock_requests r
            JOIN phones p ON r.phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            ${whereClause}
        `;
        const [countRows] = await executor.execute(countQuery, params);
        const total = countRows[0] ? Number(countRows[0].total) : 0;

        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (safePage - 1) * safeLimit;
        const totalPages = Math.ceil(total / safeLimit) || 1;

        // 2. Grouped phone query with waiting customer aggregations
        const dataQuery = `
            SELECT 
                p.phone_id,
                p.name AS phone_name,
                p.price AS phone_price,
                p.availability AS phone_availability,
                p.current_stock AS phone_current_stock,
                p.photos AS phone_photos,
                b.brand_name,
                COUNT(DISTINCT CASE WHEN r.status = 'Pending' THEN r.phone_number END) AS waiting_customers_count,
                COUNT(r.request_id) AS total_requests_count,
                COUNT(CASE WHEN r.status = 'Contacted' THEN 1 END) AS contacted_count,
                MAX(r.created_at) AS latest_request_at
            FROM back_in_stock_requests r
            JOIN phones p ON r.phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            ${whereClause}
            GROUP BY p.phone_id, p.name, p.price, p.availability, p.current_stock, p.photos, b.brand_name
            ORDER BY waiting_customers_count DESC, latest_request_at DESC
            LIMIT ? OFFSET ?
        `;

        const queryParams = [...params, safeLimit, offset];
        const [rows] = await executor.execute(dataQuery, queryParams);

        const phones = rows.map((row) => ({
            phone_id: row.phone_id,
            phone_name: row.phone_name,
            name: row.phone_name,
            brand_name: row.brand_name || null,
            price: row.phone_price !== null ? Number(row.phone_price) : null,
            availability: row.phone_availability,
            current_stock: Number(row.phone_current_stock || 0),
            photos: this._parsePhotos(row.phone_photos),
            waiting_customers_count: Number(row.waiting_customers_count || 0),
            total_requests_count: Number(row.total_requests_count || 0),
            contacted_count: Number(row.contacted_count || 0),
            latest_request_at: row.latest_request_at
        }));

        return {
            phones,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages
            }
        };
    }

    /**
     * List back-in-stock requests with pagination, searching, and filtering
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @param {string} [options.search]
     * @param {string} [options.status]
     * @param {number|string} [options.phone_id]
     * @param {number|string} [options.assigned_to_user_id]
     * @param {Object} [executor]
     * @returns {Promise<{ requests: Array, pagination: Object }>}
     */
    async findRequests({ page = 1, limit = 10, search, status, phone_id, assigned_to_user_id } = {}, executor = this.pool) {
        const conditions = [];
        const params = [];

        if (search && typeof search === 'string' && search.trim().length > 0) {
            const searchTerm = `%${search.trim()}%`;
            conditions.push('(r.customer_name LIKE ? OR r.phone_number LIKE ? OR r.email LIKE ? OR p.name LIKE ?)');
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status && typeof status === 'string' && status.trim().length > 0) {
            conditions.push('r.status = ?');
            params.push(status.trim());
        }

        if (phone_id !== undefined && phone_id !== null && String(phone_id).trim() !== '') {
            conditions.push('r.phone_id = ?');
            params.push(Number(phone_id));
        }

        if (assigned_to_user_id !== undefined && assigned_to_user_id !== null && String(assigned_to_user_id).trim() !== '') {
            conditions.push('r.assigned_to_user_id = ?');
            params.push(Number(assigned_to_user_id));
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. Total count query
        const countQuery = `
            SELECT COUNT(*) AS total 
            FROM back_in_stock_requests r 
            LEFT JOIN phones p ON r.phone_id = p.phone_id 
            ${whereClause}
        `;
        const [countRows] = await executor.execute(countQuery, params);
        const total = countRows[0] ? Number(countRows[0].total) : 0;

        // 2. Pagination calculation
        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (safePage - 1) * safeLimit;
        const totalPages = Math.ceil(total / safeLimit) || 1;

        // 3. Paginated items query
        const dataQuery = `
            SELECT 
                r.request_id,
                r.phone_id,
                r.customer_name,
                r.phone_number,
                r.email,
                r.status,
                r.notes,
                r.assigned_to_user_id,
                r.updated_by_user_id,
                r.contacted_at,
                r.created_at,
                r.updated_at,
                p.name AS phone_name,
                p.price AS phone_price,
                p.brand_id AS phone_brand_id,
                p.availability AS phone_availability,
                p.current_stock AS phone_current_stock,
                p.status AS phone_status,
                p.phone_condition AS phone_condition,
                p.photos AS phone_photos,
                b.brand_name AS phone_brand_name,
                u_assigned.display_name AS assigned_staff_name,
                u_assigned.email AS assigned_staff_email,
                u_updated.display_name AS updated_by_staff_name,
                u_updated.email AS updated_by_staff_email
            FROM back_in_stock_requests r
            LEFT JOIN phones p ON r.phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN dashboard_users u_assigned ON r.assigned_to_user_id = u_assigned.user_id
            LEFT JOIN dashboard_users u_updated ON r.updated_by_user_id = u_updated.user_id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const queryParams = [...params, safeLimit, offset];
        const [rows] = await executor.execute(dataQuery, queryParams);

        const requests = rows.map((row) => this._formatRequest(row));

        return {
            requests,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages
            }
        };
    }

    /**
     * Update request status (e.g. mark as Contacted) and record staff attribution
     * @param {number|string} requestId
     * @param {Object} updateData
     * @param {string} updateData.status
     * @param {number|null} [updateData.updated_by_user_id]
     * @param {string|null} [updateData.notes]
     * @param {Object} [executor]
     * @returns {Promise<Object>} Formatted updated request
     */
    async updateStatus(requestId, { status, updated_by_user_id = null, notes = null }, executor = this.pool) {
        const isContacted = status === 'Contacted';
        const contactedAtClause = isContacted ? ', contacted_at = CURRENT_TIMESTAMP' : '';

        let query;
        let params;

        if (notes !== null && notes !== undefined) {
            query = `
                UPDATE back_in_stock_requests
                SET status = ?,
                    updated_by_user_id = ?,
                    notes = ?
                    ${contactedAtClause}
                WHERE request_id = ?
            `;
            params = [status, updated_by_user_id, notes, requestId];
        } else {
            query = `
                UPDATE back_in_stock_requests
                SET status = ?,
                    updated_by_user_id = ?
                    ${contactedAtClause}
                WHERE request_id = ?
            `;
            params = [status, updated_by_user_id, requestId];
        }

        await executor.execute(query, params);
        return await this.findById(requestId, executor);
    }

    /**
     * Assign request to a dashboard staff user
     * @param {number|string} requestId
     * @param {Object} assignData
     * @param {number} assignData.assigned_to_user_id
     * @param {number|null} [assignData.updated_by_user_id]
     * @param {Object} [executor]
     * @returns {Promise<Object>} Formatted updated request
     */
    async assignStaff(requestId, { assigned_to_user_id, updated_by_user_id = null }, executor = this.pool) {
        const query = `
            UPDATE back_in_stock_requests
            SET assigned_to_user_id = ?,
                updated_by_user_id = ?
            WHERE request_id = ?
        `;
        await executor.execute(query, [assigned_to_user_id, updated_by_user_id, requestId]);
        return await this.findById(requestId, executor);
    }
}

const defaultRepository = new BackInStockRequestRepository();

module.exports = defaultRepository;
module.exports.BackInStockRequestRepository = BackInStockRequestRepository;
