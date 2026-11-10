/**
 * MarketplaceAuditService
 * Centralized audit logging service for all Marketplace events.
 */

const defaultPool = require('../config/db');

class MarketplaceAuditService {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Record an auditable Marketplace event
     * @param {Object} options
     * @param {'LISTING'|'ORDER'|'COMMISSION_SETTING'|'TERMS'} options.entityType
     * @param {number|string} options.entityId
     * @param {string} options.action
     * @param {number|null} [options.actorUserId]
     * @param {string} [options.actorRole='SYSTEM']
     * @param {Object|string|null} [options.details]
     * @param {string|null} [options.ipAddress]
     * @param {Object} [executor] - Optional transaction connection
     * @returns {Promise<boolean>}
     */
    async log({
        entityType,
        entityId,
        action,
        actorUserId = null,
        actorRole = 'SYSTEM',
        details = null,
        ipAddress = null
    }, executor = this.pool) {
        try {
            const query = `
                INSERT INTO marketplace_audit_logs (
                    entity_type, entity_id, action, actor_user_id, actor_role, details, ip_address
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const serializedDetails = details !== null && typeof details === 'object'
                ? JSON.stringify(details)
                : (details || null);

            await executor.query(query, [
                entityType,
                Number(entityId) || 0,
                action,
                actorUserId || null,
                actorRole,
                serializedDetails,
                ipAddress || null
            ]);
            return true;
        } catch (error) {
            console.error('[MarketplaceAuditService] Audit logging failed:', error.message);
            return false;
        }
    }

    /**
     * Retrieve audit history for a specific entity
     * @param {'LISTING'|'ORDER'|'COMMISSION_SETTING'|'TERMS'} entityType
     * @param {number|string} entityId
     * @returns {Promise<Array<Object>>}
     */
    async getEntityHistory(entityType, entityId) {
        const query = `
            SELECT l.log_id, l.entity_type, l.entity_id, l.action, l.actor_user_id, l.actor_role,
                   l.details, l.ip_address, l.created_at,
                   u.display_name AS actor_name, u.email AS actor_email
            FROM marketplace_audit_logs l
            LEFT JOIN dashboard_users u ON l.actor_user_id = u.user_id
            WHERE l.entity_type = ? AND l.entity_id = ?
            ORDER BY l.created_at DESC
        `;
        const [rows] = await this.pool.query(query, [entityType, Number(entityId)]);
        return rows.map((r) => ({
            ...r,
            details: r.details && typeof r.details === 'string' ? JSON.parse(r.details) : r.details
        }));
    }
}

const defaultAuditService = new MarketplaceAuditService();

module.exports = defaultAuditService;
module.exports.MarketplaceAuditService = MarketplaceAuditService;
