/**
 * MarketplaceOrderRepository
 * Database access layer for Marketplace Orders and Financial Snapshots.
 */

const defaultPool = require('../config/db');

function formatOrderNumber(id) {
    const timestamp = Date.now().toString().slice(-6);
    return `MKP-ORD-${new Date().getFullYear()}${timestamp}-${String(id).padStart(4, '0')}`;
}

function mapOrderRecord(row) {
    if (!row) return null;
    return {
        ...row,
        selling_price: Number(row.selling_price),
        commission_rate: Number(row.commission_rate),
        commission_amount: Number(row.commission_amount),
        seller_payout: Number(row.seller_payout)
    };
}

class MarketplaceOrderRepository {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Create a new marketplace order with permanent financial snapshot
     * @param {Object} data
     * @param {Object} [executor]
     * @returns {Promise<Object>}
     */
    async create(data, executor = this.pool) {
        const orderNumber = data.order_number || `MKP-ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const query = `
            INSERT INTO marketplace_orders (
                order_number, listing_id, seller_id, seller_name, seller_email, seller_phone,
                buyer_id, buyer_name, buyer_phone, buyer_email, buyer_address,
                selling_price, commission_rate, commission_amount, seller_payout,
                buyer_terms_version, order_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            orderNumber,
            Number(data.listing_id),
            data.seller_id || null,
            data.seller_name.trim(),
            data.seller_email.trim().toLowerCase(),
            data.seller_phone.trim(),
            data.buyer_id || null,
            data.buyer_name.trim(),
            data.buyer_phone.trim(),
            data.buyer_email.trim().toLowerCase(),
            data.buyer_address.trim(),
            Number(data.selling_price),
            Number(data.commission_rate),
            Number(data.commission_amount),
            Number(data.seller_payout),
            data.buyer_terms_version || '1.0',
            data.order_status || 'PENDING_PAYMENT'
        ];

        const [result] = await executor.query(query, values);
        return await this.findById(result.insertId, executor);
    }

    /**
     * Find order by ID
     * @param {number|string} orderId
     * @param {Object} [executor]
     * @returns {Promise<Object|null>}
     */
    async findById(orderId, executor = this.pool) {
        const query = `
            SELECT o.*,
                   l.brand, l.model, l.storage, l.color, l.condition_grade, l.photos AS listing_photos,
                   pay_u.display_name AS payment_confirmed_by_name,
                   del_u.display_name AS delivery_confirmed_by_name,
                   ver_u.display_name AS phone_verified_by_name,
                   payo_u.display_name AS seller_paid_by_name
            FROM marketplace_orders o
            LEFT JOIN marketplace_listings l ON o.listing_id = l.listing_id
            LEFT JOIN dashboard_users pay_u ON o.payment_confirmed_by = pay_u.user_id
            LEFT JOIN dashboard_users del_u ON o.delivery_confirmed_by = del_u.user_id
            LEFT JOIN dashboard_users ver_u ON o.phone_verified_by = ver_u.user_id
            LEFT JOIN dashboard_users payo_u ON o.seller_paid_by = payo_u.user_id
            WHERE o.order_id = ?
        `;
        const [rows] = await executor.query(query, [Number(orderId)]);
        if (rows.length === 0) return null;
        return mapOrderRecord(rows[0]);
    }

    /**
     * List marketplace orders with search, filters, and pagination
     * @param {Object} options
     * @returns {Promise<{ data: Array<Object>, pagination: Object }>}
     */
    async findOrders({
        order_status = null,
        seller_id = null,
        buyer_id = null,
        search = null,
        page = 1,
        limit = 20
    } = {}) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (order_status) {
            whereClause += ' AND o.order_status = ?';
            params.push(order_status);
        }

        if (seller_id) {
            whereClause += ' AND o.seller_id = ?';
            params.push(Number(seller_id));
        }

        if (buyer_id) {
            whereClause += ' AND o.buyer_id = ?';
            params.push(Number(buyer_id));
        }

        if (search) {
            const searchTerm = `%${search.trim()}%`;
            whereClause += ' AND (o.order_number LIKE ? OR o.buyer_name LIKE ? OR o.buyer_email LIKE ? OR o.seller_name LIKE ?)';
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM marketplace_orders o
            ${whereClause}
        `;
        const [countResult] = await this.pool.query(countQuery, params);
        const total = countResult[0].total;

        const dataQuery = `
            SELECT o.*,
                   l.brand, l.model, l.storage, l.color
            FROM marketplace_orders o
            LEFT JOIN marketplace_listings l ON o.listing_id = l.listing_id
            ${whereClause}
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await this.pool.query(dataQuery, [...params, limitNum, offset]);

        return {
            data: rows.map(mapOrderRecord),
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        };
    }

    /**
     * Update order status and lifecycle metadata
     * @param {number|string} orderId
     * @param {Object} updateFields
     * @param {Object} [executor]
     * @returns {Promise<Object>}
     */
    async updateStatus(orderId, updateFields, executor = this.pool) {
        const allowedCols = [
            'order_status',
            'payment_confirmed_at', 'payment_confirmed_by', 'payment_reference',
            'seller_notified_at', 'seller_notified_by',
            'delivery_confirmed_at', 'delivery_confirmed_by', 'delivery_confirmation_note',
            'phone_verified_at', 'phone_verified_by', 'phone_verification_note',
            'seller_paid_at', 'seller_paid_by', 'seller_payout_reference',
            'completed_at',
            'cancelled_at', 'cancelled_by', 'cancellation_reason'
        ];

        const updates = [];
        const params = [];

        for (const [key, val] of Object.entries(updateFields)) {
            if (allowedCols.includes(key)) {
                updates.push(`${key} = ?`);
                params.push(val);
            }
        }

        if (updates.length === 0) {
            return await this.findById(orderId, executor);
        }

        params.push(Number(orderId));
        const query = `UPDATE marketplace_orders SET ${updates.join(', ')} WHERE order_id = ?`;
        await executor.query(query, params);

        return await this.findById(orderId, executor);
    }
}

const defaultOrderRepository = new MarketplaceOrderRepository();

module.exports = defaultOrderRepository;
module.exports.MarketplaceOrderRepository = MarketplaceOrderRepository;
