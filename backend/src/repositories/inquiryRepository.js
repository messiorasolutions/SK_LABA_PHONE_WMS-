const defaultPool = require('../config/db');

class InquiryRepository {
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
     * Format raw database inquiry row into structured domain object
     */
    _formatInquiry(row) {
        if (!row) return null;

        const formatted = {
            inquiry_id: row.inquiry_id,
            customer_name: row.customer_name,
            name: row.customer_name, // alias for convenience
            phone_number: row.phone_number,
            message: row.message,
            phone_id: row.phone_id || null,
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
            selected_phone: row.phone_id ? {
                phone_id: row.phone_id,
                name: row.phone_name || null,
                price: row.phone_price !== null && row.phone_price !== undefined ? Number(row.phone_price) : null,
                brand_name: row.phone_brand_name || null,
                availability: row.phone_availability || null,
                status: row.phone_status || null,
                phone_condition: row.phone_condition || null,
                photos: this._parsePhotos(row.phone_photos)
            } : null,
            created_at: row.created_at,
            updated_at: row.updated_at
        };

        return formatted;
    }

    /**
     * Insert a new inquiry record
     * @param {Object} inquiryData
     * @param {string} inquiryData.customer_name
     * @param {string} inquiryData.phone_number
     * @param {string} inquiryData.message
     * @param {number|null} [inquiryData.phone_id]
     * @param {Object} [executor]
     * @returns {Promise<Object>} Formatted inquiry record
     */
    async create({ customer_name, phone_number, message, phone_id = null }, executor = this.pool) {
        const query = `
            INSERT INTO inquiries (
                customer_name,
                phone_number,
                message,
                phone_id,
                status
            ) VALUES (?, ?, ?, ?, 'New')
        `;

        const values = [
            customer_name.trim(),
            phone_number.trim(),
            message.trim(),
            phone_id ? Number(phone_id) : null
        ];

        const [result] = await executor.execute(query, values);
        return await this.findById(result.insertId, executor);
    }

    /**
     * Find an inquiry by ID with phone, brand, and staff associations
     * @param {number|string} inquiryId
     * @param {Object} [executor]
     * @returns {Promise<Object|null>}
     */
    async findById(inquiryId, executor = this.pool) {
        const query = `
            SELECT 
                i.inquiry_id,
                i.customer_name,
                i.phone_number,
                i.message,
                i.phone_id,
                i.status,
                i.assigned_to_user_id,
                i.updated_by_user_id,
                i.created_at,
                i.updated_at,
                p.name AS phone_name,
                p.price AS phone_price,
                p.availability AS phone_availability,
                p.status AS phone_status,
                p.phone_condition AS phone_condition,
                p.photos AS phone_photos,
                b.brand_name AS phone_brand_name,
                u_assigned.display_name AS assigned_staff_name,
                u_assigned.email AS assigned_staff_email,
                u_updated.display_name AS updated_by_staff_name,
                u_updated.email AS updated_by_staff_email
            FROM inquiries i
            LEFT JOIN phones p ON i.phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN dashboard_users u_assigned ON i.assigned_to_user_id = u_assigned.user_id
            LEFT JOIN dashboard_users u_updated ON i.updated_by_user_id = u_updated.user_id
            WHERE i.inquiry_id = ?
        `;

        const [rows] = await executor.execute(query, [inquiryId]);
        return rows.length > 0 ? this._formatInquiry(rows[0]) : null;
    }

    /**
     * List inquiries with pagination, searching, and filtering
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @param {string} [options.search]
     * @param {string} [options.status]
     * @param {number|string} [options.assigned_to_user_id]
     * @param {Object} [executor]
     * @returns {Promise<{ inquiries: Array, pagination: Object }>}
     */
    async findInquiries({ page = 1, limit = 10, search, status, assigned_to_user_id } = {}, executor = this.pool) {
        const conditions = [];
        const params = [];

        if (search && typeof search === 'string' && search.trim().length > 0) {
            const searchTerm = `%${search.trim()}%`;
            conditions.push('(i.customer_name LIKE ? OR i.phone_number LIKE ?)');
            params.push(searchTerm, searchTerm);
        }

        if (status && typeof status === 'string' && status.trim().length > 0) {
            conditions.push('i.status = ?');
            params.push(status.trim());
        }

        if (assigned_to_user_id !== undefined && assigned_to_user_id !== null && assigned_to_user_id !== '') {
            conditions.push('i.assigned_to_user_id = ?');
            params.push(Number(assigned_to_user_id));
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. Total count query
        const countQuery = `SELECT COUNT(*) AS total FROM inquiries i ${whereClause}`;
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
                i.inquiry_id,
                i.customer_name,
                i.phone_number,
                i.message,
                i.phone_id,
                i.status,
                i.assigned_to_user_id,
                i.updated_by_user_id,
                i.created_at,
                i.updated_at,
                p.name AS phone_name,
                p.price AS phone_price,
                p.availability AS phone_availability,
                p.status AS phone_status,
                p.phone_condition AS phone_condition,
                p.photos AS phone_photos,
                b.brand_name AS phone_brand_name,
                u_assigned.display_name AS assigned_staff_name,
                u_assigned.email AS assigned_staff_email,
                u_updated.display_name AS updated_by_staff_name,
                u_updated.email AS updated_by_staff_email
            FROM inquiries i
            LEFT JOIN phones p ON i.phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN dashboard_users u_assigned ON i.assigned_to_user_id = u_assigned.user_id
            LEFT JOIN dashboard_users u_updated ON i.updated_by_user_id = u_updated.user_id
            ${whereClause}
            ORDER BY i.created_at DESC, i.inquiry_id DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await executor.execute(dataQuery, [...params, safeLimit, offset]);

        return {
            inquiries: rows.map((r) => this._formatInquiry(r)),
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages
            }
        };
    }

    /**
     * Update inquiry status and record staff attribution
     * @param {number|string} inquiryId
     * @param {Object} updateData
     * @param {string} updateData.status
     * @param {number|string} updateData.updated_by_user_id
     * @param {number|string|null} [updateData.assigned_to_user_id]
     * @param {Object} [executor]
     * @returns {Promise<Object>}
     */
    async updateStatus(inquiryId, { status, updated_by_user_id, assigned_to_user_id }, executor = this.pool) {
        const fields = ['status = ?', 'updated_by_user_id = ?'];
        const values = [status, updated_by_user_id];

        if (assigned_to_user_id !== undefined) {
            fields.push('assigned_to_user_id = ?');
            values.push(assigned_to_user_id ? Number(assigned_to_user_id) : null);
        }

        values.push(inquiryId);

        const query = `
            UPDATE inquiries 
            SET ${fields.join(', ')}
            WHERE inquiry_id = ?
        `;

        await executor.execute(query, values);
        return await this.findById(inquiryId, executor);
    }
}

const defaultInquiryRepository = new InquiryRepository();

module.exports = defaultInquiryRepository;
module.exports.InquiryRepository = InquiryRepository;
