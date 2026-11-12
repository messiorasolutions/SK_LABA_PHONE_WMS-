/**
 * ProductNormalizationService
 * Handles server-side normalization of seller-submitted data into canonical
 * Smartphone catalogue structures.
 */

class ProductNormalizationService {
    /**
     * Normalizes brand input by matching case-insensitively against existing catalogue brands.
     * @param {string} rawBrand
     * @param {Array<Object>} existingBrands
     * @returns {{ brand_id: number|null, brand_name: string }}
     */
    normalizeBrand(rawBrand, existingBrands = []) {
        if (!rawBrand || typeof rawBrand !== 'string') {
            return { brand_id: null, brand_name: 'Unknown Brand' };
        }

        const trimmed = rawBrand.trim();
        const lower = trimmed.toLowerCase();

        // 1. Direct match or case-insensitive match
        const found = existingBrands.find(
            (b) => (b.brand_name && b.brand_name.toLowerCase() === lower)
        );

        if (found) {
            return {
                brand_id: found.brand_id,
                brand_name: found.brand_name
            };
        }

        // 2. Format with clean title capitalization if no exact brand found
        const canonicalName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        return {
            brand_id: null,
            brand_name: canonicalName
        };
    }

    /**
     * Normalizes model string, stripping redundant brand prefixes.
     * @param {string} rawModel
     * @param {string} brandName
     * @returns {string}
     */
    normalizeModel(rawModel, brandName = '') {
        if (!rawModel || typeof rawModel !== 'string') {
            return 'Generic Model';
        }

        let model = rawModel.trim();
        if (brandName) {
            const brandRegex = new RegExp(`^${brandName}\\s+`, 'i');
            model = model.replace(brandRegex, '').trim();
        }

        return model || rawModel.trim();
    }

    /**
     * Normalizes storage input (e.g. "128 GB", "128gb", "128g" -> "128GB")
     * Matches against existing storage_options table where available.
     * @param {string} rawStorage
     * @param {Array<Object>} existingStorageOptions
     * @returns {{ storage_id: number|null, storage_name: string }}
     */
    normalizeStorage(rawStorage, existingStorageOptions = []) {
        if (!rawStorage || typeof rawStorage !== 'string') {
            return { storage_id: null, storage_name: 'N/A' };
        }

        const clean = rawStorage.trim().toUpperCase().replace(/\s+/g, '');
        // Extract number + unit (e.g., 128GB or 1TB)
        const match = clean.match(/^(\d+)(GB|TB|MB)?$/i);
        let canonicalName = clean;
        if (match) {
            const num = match[1];
            const unit = (match[2] || 'GB').toUpperCase();
            canonicalName = `${num}${unit}`;
        }

        const found = existingStorageOptions.find(
            (s) => s.storage_name && s.storage_name.toUpperCase().replace(/\s+/g, '') === canonicalName
        );

        if (found) {
            return {
                storage_id: found.storage_id,
                storage_name: found.storage_name
            };
        }

        return {
            storage_id: null,
            storage_name: canonicalName
        };
    }

    /**
     * Normalizes RAM input (e.g. "8 gb", "8GB RAM" -> "8GB")
     * @param {string|null} rawRam
     * @returns {string|null}
     */
    normalizeRam(rawRam) {
        if (!rawRam || typeof rawRam !== 'string') return null;
        const clean = rawRam.trim().toUpperCase().replace(/RAM/i, '').replace(/\s+/g, '');
        const match = clean.match(/^(\d+)(GB|MB)?$/i);
        if (match) {
            return `${match[1]}${match[2] || 'GB'}`;
        }
        return clean || null;
    }

    /**
     * Normalizes monetary price string or number to valid decimal.
     * @param {string|number} rawPrice
     * @returns {number}
     */
    normalizePrice(rawPrice) {
        if (typeof rawPrice === 'number') {
            return Math.round(rawPrice * 100) / 100;
        }

        if (!rawPrice || typeof rawPrice !== 'string') {
            return 0.00;
        }

        // Match numeric sequence with optional commas and decimal
        const match = rawPrice.match(/\d+(?:,\d{3})*(?:\.\d+)?/);
        if (!match) {
            return 0.00;
        }

        const cleanNumber = match[0].replace(/,/g, '');
        const parsed = parseFloat(cleanNumber);
        if (isNaN(parsed) || parsed < 0) {
            return 0.00;
        }
        return Math.round(parsed * 100) / 100;
    }

    /**
     * Normalizes used phone condition grade.
     * @param {string} rawCondition
     * @returns {'BRAND_NEW'|'LIKE_NEW'|'EXCELLENT'|'VERY_GOOD'|'GOOD'|'FAIR'}
     */
    normalizeConditionGrade(rawCondition) {
        if (!rawCondition || typeof rawCondition !== 'string') {
            return 'VERY_GOOD';
        }

        const normalized = rawCondition.trim().toUpperCase().replace(/[\s-]+/g, '_');
        const validGrades = ['BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR'];

        if (validGrades.includes(normalized)) {
            return normalized;
        }

        if (normalized.includes('NEW')) return 'LIKE_NEW';
        if (normalized.includes('EXCELLENT')) return 'EXCELLENT';
        if (normalized.includes('GOOD')) return 'VERY_GOOD';
        if (normalized.includes('FAIR')) return 'FAIR';

        return 'VERY_GOOD';
    }

    /**
     * Maps a Marketplace listing and normalized attributes to the canonical Smartphone record
     * structure for insertion or update in the `phones` catalogue table.
     * @param {Object} listing - Marketplace listing record
     * @param {Object} normalizedBrand - { brand_id, brand_name }
     * @param {Object} normalizedStorage - { storage_id, storage_name }
     * @returns {Object} Smartphone record
     */
    mapToSmartphoneProduct(listing, normalizedBrand, normalizedStorage) {
        const phoneTitle = `${normalizedBrand.brand_name} ${listing.model}`;
        const photosList = Array.isArray(listing.photos) ? listing.photos : [];
        const mainPhoto = photosList.length > 0 ? photosList[0] : null;

        const colourOptions = [
            {
                name: listing.color || 'Standard',
                color_name: listing.color || 'Standard',
                color_code: '#4B5563',
                photos: photosList,
                quantity: 1,
                storage_quantities: normalizedStorage.storage_id
                    ? { [normalizedStorage.storage_id]: 1 }
                    : {}
            }
        ];

        return {
            name: phoneTitle,
            brand_id: normalizedBrand.brand_id,
            phone_condition: 'USED',
            price: Number(listing.price),
            storage_ids: normalizedStorage.storage_id ? [normalizedStorage.storage_id] : null,
            colour_options: colourOptions,
            specification_ids: null,
            warranty: listing.warranty_info || 'Marketplace Quality Checked',
            accessory_ids: null,
            description: listing.description || listing.condition_description || 'Customer-owned phone listed on Phone Marketplace.',
            low_stock_level: 1,
            current_stock: 1,
            availability: 'IN_STOCK',
            installment_enabled: 0,
            installment_plan_ids: null,
            status: 'PUBLISHED',
            is_archived: 0,
            is_new_arrival: 0,
            product_source: 'MARKETPLACE',
            ownership_type: 'SELLER_OWNED',
            marketplace_listing_id: listing.listing_id,
            battery_health: listing.battery_health !== undefined && listing.battery_health !== null
                ? Number(listing.battery_health)
                : null,
            used_condition_grade: listing.condition_grade,
            photos: photosList
        };
    }
}

const defaultProductNormalizationService = new ProductNormalizationService();

module.exports = defaultProductNormalizationService;
module.exports.ProductNormalizationService = ProductNormalizationService;
