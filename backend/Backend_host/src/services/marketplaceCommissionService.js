/**
 * MarketplaceCommissionService
 * Handles platform commission rate configuration and server-side financial calculations.
 */

const defaultPool = require('../config/db');
const AppError = require('../utils/customError');

const DEFAULT_COMMISSION_PERCENTAGE = 5.00;

class MarketplaceCommissionService {
    constructor(pool = defaultPool) {
        this.pool = pool;
    }

    /**
     * Retrieves the current active platform commission rate percentage.
     * @returns {Promise<number>} Commission percentage (e.g. 5.00)
     */
    async getCommissionRate() {
        try {
            const query = `
                SELECT setting_value 
                FROM marketplace_settings 
                WHERE setting_key = 'commission_percentage' 
                LIMIT 1
            `;
            const [rows] = await this.pool.query(query);
            if (rows.length > 0 && rows[0].setting_value !== undefined && rows[0].setting_value !== null) {
                const parsed = parseFloat(rows[0].setting_value);
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                    return Math.round(parsed * 100) / 100;
                }
            }
        } catch (err) {
            console.error('[MarketplaceCommissionService] Failed to read commission rate from settings:', err.message);
        }
        return DEFAULT_COMMISSION_PERCENTAGE;
    }

    /**
     * Updates the platform commission rate with Admin authorization and audit logging.
     * @param {number|string} newRate - New percentage (0 to 100)
     * @param {number} adminUserId - Authenticated Admin ID
     * @returns {Promise<{ commission_percentage: number }>}
     */
    async updateCommissionRate(newRate, adminUserId) {
        const parsed = parseFloat(newRate);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) {
            throw new AppError('Commission rate must be a valid percentage between 0 and 100.', 400);
        }

        const normalizedRate = (Math.round(parsed * 100) / 100).toFixed(2);

        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            const query = `
                INSERT INTO marketplace_settings (setting_key, setting_value, description, updated_by)
                VALUES ('commission_percentage', ?, 'Platform commission percentage charged on Marketplace phone sales', ?)
                ON DUPLICATE KEY UPDATE 
                    setting_value = VALUES(setting_value),
                    updated_by = VALUES(updated_by),
                    updated_at = CURRENT_TIMESTAMP
            `;
            await connection.query(query, [normalizedRate, adminUserId || null]);

            // Audit log
            const auditQuery = `
                INSERT INTO marketplace_audit_logs (entity_type, entity_id, action, actor_user_id, actor_role, details)
                VALUES ('COMMISSION_SETTING', 1, 'COMMISSION_UPDATED', ?, 'ADMIN', ?)
            `;
            const details = JSON.stringify({
                new_commission_rate: normalizedRate,
                updated_at: new Date().toISOString()
            });
            await connection.query(auditQuery, [adminUserId || null, details]);

            await connection.commit();
            return { commission_percentage: parseFloat(normalizedRate) };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Server-side calculation of commission and seller payout.
     * Uses strict decimal rounding to ensure financial accuracy.
     * @param {number|string} price - Listed selling price
     * @param {number|string} [customRate] - Optional commission rate (defaults to configured rate)
     * @returns {Promise<{ selling_price: number, commission_rate: number, commission_amount: number, seller_payout: number }>}
     */
    async calculateFinancials(price, customRate = null) {
        const numPrice = typeof price === 'number' ? price : parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0) {
            throw new AppError('Valid selling price is required for commission calculation.', 400);
        }

        const rate = customRate !== null && customRate !== undefined
            ? parseFloat(customRate)
            : await this.getCommissionRate();

        const selling_price = Math.round(numPrice * 100) / 100;
        const commission_rate = Math.round(rate * 100) / 100;
        const commission_amount = Math.round((selling_price * (commission_rate / 100)) * 100) / 100;
        const seller_payout = Math.round((selling_price - commission_amount) * 100) / 100;

        return {
            selling_price,
            commission_rate,
            commission_amount,
            seller_payout
        };
    }
}

const defaultCommissionService = new MarketplaceCommissionService();

module.exports = defaultCommissionService;
module.exports.MarketplaceCommissionService = MarketplaceCommissionService;
