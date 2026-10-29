const defaultPool = require('../config/db');

class ReservationRepository {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Safely parse JSON fields (options, photos)
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
     * Normalize DATE string or Date instance into 'YYYY-MM-DD'
     */
    _formatDate(val) {
        if (!val) return null;
        if (typeof val === 'string') {
            return val.substring(0, 10);
        }
        if (val instanceof Date) {
            const year = val.getFullYear();
            const month = String(val.getMonth() + 1).padStart(2, '0');
            const day = String(val.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return val;
    }

    /**
     * Format raw database reservation row into structured domain object
     */
    _formatReservation(row) {
        if (!row) return null;

        const formatted = {
            reservation_id: row.reservation_id,
            customer_name: row.customer_name,
            phone_number: row.phone_number,
            email: row.email || null,
            phone_id: row.phone_id,
            selected_options: this._parseJson(row.selected_options),
            preferred_collection_date: this._formatDate(row.preferred_collection_date),
            customer_note: row.customer_note || null,
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
                photos: this._parseJson(row.phone_photos)
            } : null,
            created_at: row.created_at,
            updated_at: row.updated_at
        };

        return formatted;
    }

    /**
     * Insert a new reservation record (C-09)
     * Stock is explicitly NOT modified.
     */
    async create(
        {
            customer_name,
            phone_number,
            email = null,
            phone_id,
            selected_options = null,
            preferred_collection_date,
            customer_note = null
        },
        executor = this.pool
    ) {
        const query = `
            INSERT INTO reservations (
                customer_name,
                phone_number,
                email,
                phone_id,
                selected_options,
                preferred_collection_date,
                customer_note,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;

        const values = [
            customer_name.trim(),
            phone_number.trim(),
            email ? email.trim() : null,
            Number(phone_id),
            selected_options ? JSON.stringify(selected_options) : null,
            preferred_collection_date,
            customer_note ? customer_note.trim() : null
        ];

        const [result] = await executor.execute(query, values);
        return await this.findById(result.insertId, executor);
    }

    /**
     * Find a reservation by ID with phone, brand, and staff associations
     */
    async findById(reservationId, executor = this.pool) {
        const query = `
            SELECT 
                r.reservation_id,
                r.customer_name,
                r.phone_number,
                r.email,
                r.phone_id,
                r.selected_options,
                r.preferred_collection_date,
                r.customer_note,
                r.status,
                r.assigned_to_user_id,
                r.updated_by_user_id,
                r.created_at,
                r.updated_at,
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
            FROM reservations r
            LEFT JOIN phones p ON r.phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN dashboard_users u_assigned ON r.assigned_to_user_id = u_assigned.user_id
            LEFT JOIN dashboard_users u_updated ON r.updated_by_user_id = u_updated.user_id
            WHERE r.reservation_id = ?
        `;

        const [rows] = await executor.execute(query, [reservationId]);
        return rows.length > 0 ? this._formatReservation(rows[0]) : null;
    }

    /**
     * List reservations with pagination, searching, and filtering (ST-07)
     */
    async findReservations(
        {
            page = 1,
            limit = 10,
            search,
            status,
            phone_id,
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
            conditions.push('(r.customer_name LIKE ? OR r.phone_number LIKE ? OR r.email LIKE ?)');
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (status && typeof status === 'string' && status.trim().length > 0) {
            conditions.push('r.status = ?');
            params.push(status.trim());
        }

        if (phone_id !== undefined && phone_id !== null && phone_id !== '') {
            conditions.push('r.phone_id = ?');
            params.push(Number(phone_id));
        }

        if (assigned_to_user_id !== undefined && assigned_to_user_id !== null && assigned_to_user_id !== '') {
            conditions.push('r.assigned_to_user_id = ?');
            params.push(Number(assigned_to_user_id));
        }

        if (from_date && typeof from_date === 'string' && from_date.trim().length > 0) {
            conditions.push('r.preferred_collection_date >= ?');
            params.push(from_date.trim());
        }

        if (to_date && typeof to_date === 'string' && to_date.trim().length > 0) {
            conditions.push('r.preferred_collection_date <= ?');
            params.push(to_date.trim());
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. Total count query
        const countQuery = `SELECT COUNT(*) AS total FROM reservations r ${whereClause}`;
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
                r.reservation_id,
                r.customer_name,
                r.phone_number,
                r.email,
                r.phone_id,
                r.selected_options,
                r.preferred_collection_date,
                r.customer_note,
                r.status,
                r.assigned_to_user_id,
                r.updated_by_user_id,
                r.created_at,
                r.updated_at,
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
            FROM reservations r
            LEFT JOIN phones p ON r.phone_id = p.phone_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN dashboard_users u_assigned ON r.assigned_to_user_id = u_assigned.user_id
            LEFT JOIN dashboard_users u_updated ON r.updated_by_user_id = u_updated.user_id
            ${whereClause}
            ORDER BY r.created_at DESC, r.reservation_id DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await executor.execute(dataQuery, [...params, safeLimit, offset]);

        return {
            reservations: rows.map((row) => this._formatReservation(row)),
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages
            }
        };
    }

    /**
     * Update reservation status and staff audit attribution (ST-07)
     * Inventory stock is NOT modified.
     */
    async updateStatus(
        reservationId,
        { status, updated_by_user_id, assigned_to_user_id },
        executor = this.pool
    ) {
        const updateFields = ['status = ?', 'updated_by_user_id = ?'];
        const updateValues = [status, Number(updated_by_user_id)];

        if (assigned_to_user_id !== undefined) {
            updateFields.push('assigned_to_user_id = ?');
            updateValues.push(assigned_to_user_id !== null ? Number(assigned_to_user_id) : null);
        }

        updateValues.push(Number(reservationId));

        const query = `
            UPDATE reservations
            SET ${updateFields.join(', ')}
            WHERE reservation_id = ?
        `;

        await executor.execute(query, updateValues);
        return await this.findById(reservationId, executor);
    }

    /**
     * Update assigned staff member on a reservation
     */
    async updateAssignment(
        reservationId,
        { assigned_to_user_id, updated_by_user_id },
        executor = this.pool
    ) {
        const query = `
            UPDATE reservations
            SET assigned_to_user_id = ?, updated_by_user_id = ?
            WHERE reservation_id = ?
        `;

        const values = [
            assigned_to_user_id !== null ? Number(assigned_to_user_id) : null,
            Number(updated_by_user_id),
            Number(reservationId)
        ];

        await executor.execute(query, values);
        return await this.findById(reservationId, executor);
    }
}

const defaultReservationRepository = new ReservationRepository();

module.exports = defaultReservationRepository;
module.exports.ReservationRepository = ReservationRepository;
