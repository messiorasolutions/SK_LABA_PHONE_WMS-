/**
 * Phone Availability Calculation Utility
 * SK LABA PHONE WMS - Phone Stock Management
 *
 * Availability Business Rules:
 * 1. If current_stock <= 0, availability must be SOLD_OUT.
 * 2. If current_stock > 0 and current_stock <= low_stock_level, availability must be LOW_STOCK.
 * 3. If current_stock > low_stock_level, availability must be IN_STOCK.
 * 4. Preserve COMING_SOON only according to existing intended business rules (when current_stock <= 0).
 */

/**
 * Calculate the correct phone availability based on current stock,
 * low stock threshold, and existing/requested availability.
 *
 * @param {number|string} currentStock - Current stock quantity
 * @param {number|string} [lowStockLevel=5] - Low stock threshold (defaults to 5)
 * @param {string|null} [explicitAvailability=null] - Requested or current availability (e.g. COMING_SOON)
 * @returns {'SOLD_OUT'|'LOW_STOCK'|'IN_STOCK'|'COMING_SOON'}
 */
function calculatePhoneAvailability(currentStock, lowStockLevel = 5, explicitAvailability = null) {
    const stock = Number(currentStock ?? 0);
    const threshold = (lowStockLevel !== undefined && lowStockLevel !== null && !isNaN(Number(lowStockLevel)))
        ? Number(lowStockLevel)
        : 5;
    const cleanAvail = explicitAvailability ? String(explicitAvailability).trim().toUpperCase() : null;

    if (stock <= 0) {
        if (cleanAvail === 'COMING_SOON') {
            return 'COMING_SOON';
        }
        return 'SOLD_OUT';
    }

    if (stock <= threshold) {
        return 'LOW_STOCK';
    }

    return 'IN_STOCK';
}

module.exports = {
    calculatePhoneAvailability
};
