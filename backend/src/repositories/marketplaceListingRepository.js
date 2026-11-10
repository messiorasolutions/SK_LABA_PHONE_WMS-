/**
 * MarketplaceListingRepository
 * Database access layer for Marketplace Listings.
 */

const defaultPool = require('../config/db');

function formatListingReference(id) {
    if (!id && id !== 0) return '';
    const num = parseInt(id, 10);
    if (isNaN(num)) return `MKP-LST-${id}`;
    return `MKP-LST-${String(num).padStart(6, '0')}`;
}

function mapListingRecord(row) {
    if (!row) return null;

    let photos = [];
    if (typeof row.photos === 'string') {
        try { photos = JSON.parse(row.photos); } catch { photos = []; }
    } else if (Array.isArray(row.photos)) {
        photos = row.photos;
    }

    let accessories = [];
    if (typeof row.accessories_included === 'string') {
        try { accessories = JSON.parse(row.accessories_included); } catch { accessories = []; }
    } else if (Array.isArray(row.accessories_included)) {
        accessories = row.accessories_included;
    }

    return {
        ...row,
        listing_ref: formatListingReference(row.listing_id),
        price: Number(row.price),
        photos,
        accessories_included: accessories,
        original_box: Boolean(row.original_box),
        charger_included: Boolean(row.charger_included)
    };
}

class MarketplaceListingRepository {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Create a new marketplace listing
     * @param {Object} data
     * @param {Object} [executor]
     * @returns {Promise<Object>} Created listing
     */
    async create(data, executor = this.pool) {
        const query = `
            INSERT INTO marketplace_listings (
                seller_id, seller_name, seller_email, seller_phone, brand_id, brand, model,
                storage, color, condition_grade, condition_description, physical_condition,
                display_condition, camera_condition, biometrics_status, battery_health,
                price, description, accessories_included, original_box, charger_included,
                warranty_info, photos, status, seller_terms_version
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.seller_id || null,
            data.seller_name.trim(),
            data.seller_email.trim().toLowerCase(),
            data.seller_phone.trim(),
            data.brand_id || null,
            data.brand.trim(),
            data.model.trim(),
            data.storage.trim(),
            data.color.trim(),
            data.condition_grade || 'VERY_GOOD',
            data.condition_description.trim(),
            data.physical_condition || null,
            data.display_condition || null,
            data.camera_condition || null,
            data.biometrics_status || null,
            data.battery_health !== undefined && data.battery_health !== null ? Number(data.battery_health) : null,
            Number(data.price),
            data.description || null,
            data.accessories_included ? JSON.stringify(data.accessories_included) : null,
            data.original_box ? 1 : 0,
            data.charger_included ? 1 : 0,
            data.warranty_info || null,
            JSON.stringify(Array.isArray(data.photos) ? data.photos : []),
            data.status || 'PENDING_REVIEW',
            data.seller_terms_version || '1.0'
        ];

        const [result] = await executor.query(query, values);
        return await this.findById(result.insertId, executor);
    }

    /**
     * Retrieve listing by ID
     * @param {number|string} listingId
     * @param {Object} [executor]
     * @returns {Promise<Object|null>}
     */
    async findById(listingId, executor = this.pool) {
        const query = `
            SELECT l.*, 
                   b.brand_name AS canonical_brand_name,
                   rev.display_name AS reviewer_name,
                   app.display_name AS approver_name
            FROM marketplace_listings l
            LEFT JOIN brands b ON l.brand_id = b.brand_id
            LEFT JOIN dashboard_users rev ON l.reviewed_by = rev.user_id
            LEFT JOIN dashboard_users app ON l.approved_by = app.user_id
            WHERE l.listing_id = ?
        `;
        const [rows] = await executor.query(query, [Number(listingId)]);
        if (rows.length === 0) return null;
        return mapListingRecord(rows[0]);
    }

    /**
     * List marketplace listings with search, filters, and pagination
     * @param {Object} options
     * @returns {Promise<{ data: Array<Object>, pagination: Object }>}
     */
    async findListings({
        status = null,
        seller_id = null,
        seller_email = null,
        brand = null,
        condition_grade = null,
        min_price = null,
        max_price = null,
        search = null,
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'DESC'
    } = {}) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            if (Array.isArray(status)) {
                whereClause += ` AND l.status IN (${status.map(() => '?').join(', ')})`;
                params.push(...status);
            } else {
                whereClause += ' AND l.status = ?';
                params.push(status);
            }
        }

        if (seller_id) {
            whereClause += ' AND l.seller_id = ?';
            params.push(Number(seller_id));
        }

        if (seller_email) {
            whereClause += ' AND l.seller_email = ?';
            params.push(seller_email.trim().toLowerCase());
        }

        if (brand) {
            whereClause += ' AND (l.brand LIKE ? OR b.brand_name LIKE ?)';
            params.push(`%${brand.trim()}%`, `%${brand.trim()}%`);
        }

        if (condition_grade) {
            whereClause += ' AND l.condition_grade = ?';
            params.push(condition_grade);
        }

        if (min_price !== null && min_price !== undefined) {
            whereClause += ' AND l.price >= ?';
            params.push(Number(min_price));
        }

        if (max_price !== null && max_price !== undefined) {
            whereClause += ' AND l.price <= ?';
            params.push(Number(max_price));
        }

        if (search) {
            const searchTerm = `%${search.trim()}%`;
            whereClause += ' AND (l.model LIKE ? OR l.brand LIKE ? OR l.seller_name LIKE ? OR l.seller_email LIKE ?)';
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Count total matching
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM marketplace_listings l
            LEFT JOIN brands b ON l.brand_id = b.brand_id
            ${whereClause}
        `;
        const [countResult] = await this.pool.query(countQuery, params);
        const total = countResult[0].total;

        // Valid sort columns
        const allowedSorts = ['created_at', 'price', 'brand', 'model', 'status'];
        const sortField = allowedSorts.includes(sort_by) ? `l.${sort_by}` : 'l.created_at';
        const sortDirection = String(sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const dataQuery = `
            SELECT l.*, 
                   b.brand_name AS canonical_brand_name,
                   rev.display_name AS reviewer_name,
                   app.display_name AS approver_name
            FROM marketplace_listings l
            LEFT JOIN brands b ON l.brand_id = b.brand_id
            LEFT JOIN dashboard_users rev ON l.reviewed_by = rev.user_id
            LEFT JOIN dashboard_users app ON l.approved_by = app.user_id
            ${whereClause}
            ORDER BY ${sortField} ${sortDirection}
            LIMIT ? OFFSET ?
        `;
        const [rows] = await this.pool.query(dataQuery, [...params, limitNum, offset]);

        return {
            data: rows.map(mapListingRecord),
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        };
    }

    /**
     * Update listing status and administrative review attribution
     * @param {number|string} listingId
     * @param {Object} updateFields
     * @param {Object} [executor]
     * @returns {Promise<Object>}
     */
    async updateStatus(listingId, {
        status,
        admin_notes = null,
        rejection_reason = null,
        changes_requested_reason = null,
        reviewed_by = null,
        reviewed_at = null,
        approved_by = null,
        approved_at = null,
        published_at = null
    }, executor = this.pool) {
        const query = `
            UPDATE marketplace_listings
            SET status = ?,
                admin_notes = COALESCE(?, admin_notes),
                rejection_reason = ?,
                changes_requested_reason = ?,
                reviewed_by = COALESCE(?, reviewed_by),
                reviewed_at = COALESCE(?, reviewed_at),
                approved_by = COALESCE(?, approved_by),
                approved_at = COALESCE(?, approved_at),
                published_at = COALESCE(?, published_at)
            WHERE listing_id = ?
        `;

        await executor.query(query, [
            status,
            admin_notes,
            rejection_reason,
            changes_requested_reason,
            reviewed_by,
            reviewed_at,
            approved_by,
            approved_at,
            published_at,
            Number(listingId)
        ]);

        return await this.findById(listingId, executor);
    }

    /**
     * Update listing data
     * @param {number|string} listingId
     * @param {Object} data
     * @param {Object} [executor]
     * @returns {Promise<Object>}
     */
    async update(listingId, data, executor = this.pool) {
        const allowedCols = [
            'brand', 'model', 'storage', 'color', 'condition_grade',
            'condition_description', 'physical_condition', 'display_condition',
            'camera_condition', 'biometrics_status', 'battery_health',
            'price', 'description', 'accessories_included', 'original_box',
            'charger_included', 'warranty_info', 'photos', 'status'
        ];

        const updates = [];
        const params = [];

        for (const [key, val] of Object.entries(data)) {
            if (allowedCols.includes(key)) {
                updates.push(`${key} = ?`);
                if (key === 'photos' || key === 'accessories_included') {
                    params.push(Array.isArray(val) ? JSON.stringify(val) : val);
                } else if (key === 'original_box' || key === 'charger_included') {
                    params.push(val ? 1 : 0);
                } else {
                    params.push(val);
                }
            }
        }

        if (updates.length === 0) {
            return await this.findById(listingId, executor);
        }

        params.push(Number(listingId));
        const query = `UPDATE marketplace_listings SET ${updates.join(', ')} WHERE listing_id = ?`;
        await executor.query(query, params);

        return await this.findById(listingId, executor);
    }
}

const defaultListingRepository = new MarketplaceListingRepository();

module.exports = defaultListingRepository;
module.exports.MarketplaceListingRepository = MarketplaceListingRepository;
module.exports.formatListingReference = formatListingReference;
