const phoneRepository = require('../repositories/phoneRepository');
const brandRepository = require('../repositories/brandRepository');
const storageOptionRepository = require('../repositories/storageOptionRepository');
const specificationRepository = require('../repositories/specificationRepository');
const offerRepository = require('../repositories/offerRepository');
const installmentPlanService = require('./installmentPlanService');
const AppError = require('../utils/customError');

class PhoneService {
    /**
     * Create a new phone record
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async createPhone(data) {
        // Validate brand existence
        const brand = await brandRepository.findById(data.brand_id);
        if (!brand) {
            throw new AppError(`Brand with ID ${data.brand_id} not found.`, 404);
        }

        const cleanName = data.name.trim();
        const cleanCondition = data.phone_condition.trim().toUpperCase();
        const numericPrice = Number(data.price);
        const lowStockLevel = data.low_stock_level !== undefined
            ? Number(data.low_stock_level)
            : (data.stock_quantity !== undefined ? Number(data.stock_quantity) : 5);
        const currentStock = data.current_stock !== undefined ? Number(data.current_stock) : 0;

        // Auto-assign availability if not explicitly passed
        let availability = data.availability ? data.availability.trim().toUpperCase() : null;
        if (!availability) {
            if (currentStock === 0) {
                availability = 'SOLD_OUT';
            } else if (currentStock <= lowStockLevel) {
                availability = 'LOW_STOCK';
            } else {
                availability = 'IN_STOCK';
            }
        }

        const status = data.status ? data.status.trim().toUpperCase() : 'DRAFT';
        const isArchived = data.is_archived !== undefined
            ? Boolean(data.is_archived === true || data.is_archived === 1 || data.is_archived === 'true' || data.is_archived === 'yes')
            : (status === 'ARCHIVED');

        const phoneRecord = {
            name: cleanName,
            brand_id: Number(data.brand_id),
            phone_condition: cleanCondition,
            price: numericPrice,
            storage_ids: Array.isArray(data.storage_ids) ? data.storage_ids : null,
            colour_options: Array.isArray(data.colour_options) ? data.colour_options : null,
            specification_ids: Array.isArray(data.specification_ids) ? data.specification_ids : null,
            warranty: data.warranty ? data.warranty.trim() : null,
            accessory_ids: Array.isArray(data.accessory_ids) ? data.accessory_ids : null,
            description: data.description ? data.description.trim() : null,
            low_stock_level: lowStockLevel,
            current_stock: currentStock,
            availability,
            installment_enabled: Boolean(data.installment_enabled),
            installment_plan_ids: Array.isArray(data.installment_plan_ids) ? data.installment_plan_ids : null,
            status,
            is_archived: isArchived ? 1 : 0,
            photos: Array.isArray(data.photos) ? data.photos : null
        };

        const newPhone = await phoneRepository.create(phoneRecord);
        return newPhone;
    }

    /**
     * Retrieve phones (with optional filters)
     * @param {Object} filters
     * @returns {Promise<Array>}
     */
    async getAllPhones(filters = {}) {
        return await phoneRepository.findAll(filters);
    }

    /**
     * Retrieve all phones for stock management screen
     * @param {Object} filters
     * @returns {Promise<Array>}
     */
    async getStockList(filters = {}) {
        return await phoneRepository.findAllStock(filters);
    }

    /**
     * Add stock quantity to a phone
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async addStock(id, data = {}) {
        const phone = await phoneRepository.findById(id);
        if (!phone) {
            throw new AppError(`Phone with ID ${id} not found.`, 404);
        }

        const quantity = data.quantity;
        if (quantity === undefined || quantity === null || isNaN(quantity) || Number(quantity) <= 0 || !Number.isInteger(Number(quantity))) {
            throw new AppError('Quantity must be a positive integer greater than 0.', 400);
        }

        const addedQty = Number(quantity);
        const prevStock = Number(phone.current_stock || 0);
        const newStock = prevStock + addedQty;

        // Auto-assign availability
        let newAvailability = 'IN_STOCK';
        if (newStock <= phone.low_stock_level) {
            newAvailability = 'LOW_STOCK';
        }

        const updated = await phoneRepository.addStock(id, addedQty, newAvailability);
        return {
            ...updated,
            previous_stock: prevStock,
            added_quantity: addedQty,
            current_stock: newStock,
            reason: data.reason || 'RESTOCK',
            notes: data.notes || null
        };
    }

    /**
     * Deduct stock quantity from a phone
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async removeStock(id, data = {}) {
        const phone = await phoneRepository.findById(id);
        if (!phone) {
            throw new AppError(`Phone with ID ${id} not found.`, 404);
        }

        const quantity = data.quantity;
        if (quantity === undefined || quantity === null || isNaN(quantity) || Number(quantity) <= 0 || !Number.isInteger(Number(quantity))) {
            throw new AppError('Quantity must be a positive integer greater than 0.', 400);
        }

        const removedQty = Number(quantity);
        const prevStock = Number(phone.current_stock || 0);

        if (prevStock < removedQty) {
            throw new AppError(`Cannot deduct ${removedQty} units. Current stock is only ${prevStock}.`, 400);
        }

        const newStock = prevStock - removedQty;

        // Auto-assign availability: SOLD_OUT if 0, LOW_STOCK if <= threshold, else IN_STOCK
        let newAvailability = 'IN_STOCK';
        if (newStock === 0) {
            newAvailability = 'SOLD_OUT';
        } else if (newStock <= phone.low_stock_level) {
            newAvailability = 'LOW_STOCK';
        }

        const updated = await phoneRepository.removeStock(id, removedQty, newAvailability);
        return {
            ...updated,
            previous_stock: prevStock,
            removed_quantity: removedQty,
            current_stock: newStock,
            reason: data.reason || 'SALE',
            notes: data.notes || null
        };
    }

    /**
     * Mark a phone as SOLD_OUT
     * @param {number|string} id
     * @param {Object} [data]
     * @returns {Promise<Object>}
     */
    async markSoldOut(id, data = {}) {
        const phone = await phoneRepository.findById(id);
        if (!phone) {
            throw new AppError(`Phone with ID ${id} not found.`, 404);
        }

        const resetQuantity = data.reset_quantity === true || data.reset_quantity === 'true';
        const updated = await phoneRepository.markSoldOut(id, resetQuantity);
        return updated;
    }

    /**
     * Retrieve all archived phones
     * @param {Object} filters
     * @returns {Promise<Array>}
     */
    async getArchivedPhones(filters = {}) {
        return await phoneRepository.findAll({ ...filters, archived: true });
    }

    /**
     * Retrieve a phone by ID
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async getPhoneById(id) {
        const phone = await phoneRepository.findById(id);
        if (!phone) {
            throw new AppError(`Phone with ID ${id} not found.`, 404);
        }
        return phone;
    }

    /**
     * Archive a phone by ID
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async archivePhone(id) {
        const existing = await phoneRepository.findById(id);
        if (!existing) {
            throw new AppError(`Phone with ID ${id} not found.`, 404);
        }

        return await phoneRepository.archive(id);
    }

    /**
     * Restore an archived phone by ID
     * @param {number|string} id
     * @param {string} [restoreStatus='DRAFT']
     * @returns {Promise<Object>}
     */
    async restorePhone(id, restoreStatus = 'DRAFT') {
        const existing = await phoneRepository.findById(id);
        if (!existing) {
            throw new AppError(`Phone with ID ${id} not found.`, 404);
        }

        return await phoneRepository.restore(id, restoreStatus);
    }

    /**
     * Update an existing phone
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async updatePhone(id, data) {
        const existing = await phoneRepository.findById(id);
        if (!existing) {
            throw new AppError(`Phone with ID ${id} not found.`, 404);
        }

        if (data.brand_id !== undefined) {
            const brand = await brandRepository.findById(data.brand_id);
            if (!brand) {
                throw new AppError(`Brand with ID ${data.brand_id} not found.`, 404);
            }
        }

        const nextStatus = data.status !== undefined ? data.status.trim().toUpperCase() : existing.status;
        let nextIsArchived;
        if (data.is_archived !== undefined) {
            nextIsArchived = Boolean(data.is_archived === true || data.is_archived === 1 || data.is_archived === 'true' || data.is_archived === 'yes') ? 1 : 0;
        } else if (data.status !== undefined) {
            nextIsArchived = nextStatus === 'ARCHIVED' ? 1 : 0;
        } else {
            nextIsArchived = existing.is_archived ? 1 : 0;
        }

        const merged = {
            name: data.name !== undefined ? data.name.trim() : existing.name,
            brand_id: data.brand_id !== undefined ? Number(data.brand_id) : existing.brand_id,
            phone_condition: data.phone_condition !== undefined ? data.phone_condition.trim().toUpperCase() : existing.phone_condition,
            price: data.price !== undefined ? Number(data.price) : Number(existing.price),
            storage_ids: data.storage_ids !== undefined ? data.storage_ids : existing.storage_ids,
            colour_options: data.colour_options !== undefined ? data.colour_options : existing.colour_options,
            specification_ids: data.specification_ids !== undefined ? data.specification_ids : existing.specification_ids,
            warranty: data.warranty !== undefined ? (data.warranty ? data.warranty.trim() : null) : existing.warranty,
            accessory_ids: data.accessory_ids !== undefined ? data.accessory_ids : existing.accessory_ids,
            description: data.description !== undefined ? (data.description ? data.description.trim() : null) : existing.description,
            low_stock_level: data.low_stock_level !== undefined
                ? Number(data.low_stock_level)
                : (data.stock_quantity !== undefined ? Number(data.stock_quantity) : (existing.low_stock_level ?? existing.stock_quantity ?? 5)),
            current_stock: data.current_stock !== undefined
                ? Number(data.current_stock)
                : existing.current_stock,
            availability: data.availability !== undefined ? data.availability.trim().toUpperCase() : existing.availability,
            installment_enabled: data.installment_enabled !== undefined ? Boolean(data.installment_enabled) : Boolean(existing.installment_enabled),
            installment_plan_ids: data.installment_plan_ids !== undefined ? data.installment_plan_ids : existing.installment_plan_ids,
            status: nextStatus,
            is_archived: nextIsArchived,
            photos: data.photos !== undefined ? data.photos : existing.photos
        };

        const updatedPhone = await phoneRepository.update(id, merged);
        return updatedPhone;
    }

    /**
     * Delete a phone by ID
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async deletePhone(id) {
        const existing = await phoneRepository.findById(id);
        if (!existing) {
            throw new AppError(`Phone with ID ${id} not found.`, 404);
        }

        await phoneRepository.delete(id);
        return {
            phone_id: Number(id),
            name: existing.name
        };
    }

    /**
     * Compare 2 or 3 phones side-by-side (SRS C-05)
     * @param {Array<number|string>|string} rawIds
     * @returns {Promise<Object>}
     */
    async comparePhones(rawIds) {
        let parsedIds = [];

        if (Array.isArray(rawIds)) {
            parsedIds = rawIds.map(id => Number(id));
        } else if (typeof rawIds === 'string') {
            parsedIds = rawIds.split(',').map(s => Number(s.trim()));
        } else if (typeof rawIds === 'number') {
            parsedIds = [rawIds];
        }

        const uniqueIds = Array.from(new Set(parsedIds.filter(id => !isNaN(id) && id > 0)));

        if (uniqueIds.length < 2) {
            throw new AppError('Phone comparison requires at least 2 distinct phones (select 2 or 3 phones).', 400);
        }

        if (uniqueIds.length > 3) {
            throw new AppError('Phone comparison allows a maximum of 3 phones at a time.', 400);
        }

        // Fetch phones
        const rawPhones = [];
        for (const phoneId of uniqueIds) {
            const phone = await phoneRepository.findById(phoneId);
            if (!phone) {
                throw new AppError(`Phone with ID ${phoneId} was not found.`, 404);
            }
            if (phone.is_archived || phone.status === 'ARCHIVED') {
                throw new AppError(`Phone '${phone.name}' (ID ${phoneId}) is archived and cannot be compared.`, 400);
            }
            rawPhones.push(phone);
        }

        // Enrich each phone with details, offers, storages, specs, accessories, installments
        const enrichedPhones = await Promise.all(rawPhones.map(async (phone) => {
            const storageIds = Array.isArray(phone.storage_ids) ? phone.storage_ids : [];
            const specIds = Array.isArray(phone.specification_ids) ? phone.specification_ids : [];
            const accessoryIds = Array.isArray(phone.accessory_ids) ? phone.accessory_ids : [];

            // Resolve storage options
            const storages = await storageOptionRepository.findByIds(storageIds);
            const storageNames = storages.map(s => s.storage_name);

            // Resolve specifications
            const specs = await specificationRepository.findByIds(specIds);
            const specItems = specs.map(s => ({
                specification_id: s.specification_id,
                name: s.specification_name,
                type: s.specification_type,
                description: s.description
            }));

            // Resolve accessories
            const accessories = await specificationRepository.findByIds(accessoryIds);
            const accessoryNames = accessories.map(a => a.specification_name);

            // Resolve active offer
            let activeOffer = {
                has_active_offer: false,
                offer_price: null,
                discount_percentage: 0,
                discount_amount: 0
            };
            try {
                const offer = await offerRepository.findActiveOfferByPhoneId(phone.phone_id);
                if (offer) {
                    activeOffer = {
                        has_active_offer: true,
                        offer_id: offer.offer_id,
                        title: offer.title,
                        regular_price: Number(offer.regular_price),
                        offer_price: Number(offer.offer_price),
                        discount_percentage: offer.discount_percentage,
                        discount_amount: offer.discount_amount,
                        end_date_time: offer.end_date_time,
                        seconds_remaining: offer.seconds_remaining
                    };
                }
            } catch (err) { // eslint-disable-line no-unused-vars
                // keep default if lookup error
            }

            // Resolve installment
            let installment = {
                installment_enabled: Boolean(phone.installment_enabled),
                starting_monthly_payment: null,
                plans_count: 0
            };
            if (phone.installment_enabled) {
                try {
                    const instResult = await installmentPlanService.calculatePhoneInstallments(phone.phone_id);
                    if (instResult.plans && instResult.plans.length > 0) {
                        const monthlyPayments = instResult.plans.map(p => Number(p.monthly_payment));
                        installment.starting_monthly_payment = Math.min(...monthlyPayments);
                        installment.plans_count = instResult.plans.length;
                    }
                } catch (err) { // eslint-disable-line no-unused-vars
                    // keep default
                }
            }

            // Availability display label
            let availabilityLabel = phone.availability;
            if (phone.availability === 'SOLD_OUT') {
                availabilityLabel = 'Sold Out';
            } else if (phone.availability === 'LOW_STOCK') {
                availabilityLabel = `Only ${phone.current_stock} left`;
            } else if (phone.availability === 'IN_STOCK') {
                availabilityLabel = 'In Stock';
            } else if (phone.availability === 'COMING_SOON') {
                availabilityLabel = 'Coming Soon';
            }

            const mainPhoto = (Array.isArray(phone.photos) && phone.photos.length > 0)
                ? phone.photos[0]
                : null;

            const regularPrice = Number(phone.price);
            const effectivePrice = activeOffer.has_active_offer ? activeOffer.offer_price : regularPrice;

            return {
                phone_id: phone.phone_id,
                name: phone.name,
                brand_id: phone.brand_id,
                brand_name: phone.brand_name || null,
                main_photo: mainPhoto,
                photos: Array.isArray(phone.photos) ? phone.photos : [],
                phone_condition: phone.phone_condition,
                regular_price: regularPrice,
                effective_price: effectivePrice,
                availability: phone.availability,
                availability_label: availabilityLabel,
                current_stock: phone.current_stock,
                warranty: phone.warranty || 'No warranty specified',
                colour_options: Array.isArray(phone.colour_options) ? phone.colour_options : [],
                storage_options: storages.map(s => ({ storage_id: s.storage_id, storage_name: s.storage_name, capacity_gb: s.capacity_gb })),
                storage_names: storageNames,
                specifications: specItems,
                accessory_names: accessoryNames,
                active_offer: activeOffer,
                installment: installment,
                description: phone.description || null
            };
        }));

        // Generate comparison matrix for frontend side-by-side rendering
        const comparisonMatrix = [
            {
                key: 'name',
                label: 'Phone Model',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.name]))
            },
            {
                key: 'brand_name',
                label: 'Brand',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.brand_name || 'N/A']))
            },
            {
                key: 'main_photo',
                label: 'Photo',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.main_photo]))
            },
            {
                key: 'regular_price',
                label: 'Regular Price',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.regular_price]))
            },
            {
                key: 'offer_price',
                label: 'Offer Price',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.active_offer.has_active_offer ? p.active_offer.offer_price : null]))
            },
            {
                key: 'savings',
                label: 'Savings / Discount',
                values: Object.fromEntries(enrichedPhones.map(p => [
                    p.phone_id,
                    p.active_offer.has_active_offer ? `${p.active_offer.discount_percentage}% off (Save $${p.active_offer.discount_amount})` : 'None'
                ]))
            },
            {
                key: 'phone_condition',
                label: 'Condition',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.phone_condition]))
            },
            {
                key: 'availability_label',
                label: 'Availability',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.availability_label]))
            },
            {
                key: 'current_stock',
                label: 'Current Stock',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.current_stock]))
            },
            {
                key: 'colour_options',
                label: 'Colours',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.colour_options]))
            },
            {
                key: 'storage_names',
                label: 'Storage Options',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.storage_names.length > 0 ? p.storage_names : ['Standard']]))
            },
            {
                key: 'warranty',
                label: 'Warranty',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.warranty]))
            },
            {
                key: 'accessory_names',
                label: 'Included Accessories',
                values: Object.fromEntries(enrichedPhones.map(p => [p.phone_id, p.accessory_names.length > 0 ? p.accessory_names : ['None specified']]))
            },
            {
                key: 'installment',
                label: 'Monthly Instalment',
                values: Object.fromEntries(enrichedPhones.map(p => [
                    p.phone_id,
                    p.installment.installment_enabled && p.installment.starting_monthly_payment
                        ? `From $${p.installment.starting_monthly_payment}/mo (${p.installment.plans_count} plans)`
                        : 'Not available'
                ]))
            },
            {
                key: 'specifications',
                label: 'Key Specifications',
                values: Object.fromEntries(enrichedPhones.map(p => [
                    p.phone_id,
                    p.specifications.map(s => `${s.name}: ${s.description || ''}`).join('; ') || 'Standard specifications'
                ]))
            }
        ];

        return {
            count: enrichedPhones.length,
            phones: enrichedPhones,
            comparison_matrix: comparisonMatrix
        };
    }

    /**
     * Retrieve live phone details for customer favorites (SRS C-06)
     * @param {Array<number|string>|string} rawIds
     * @returns {Promise<Object>}
     */
    async getFavorites(rawIds) {
        if (!rawIds) {
            return {
                count: 0,
                data: [],
                unavailable_ids: []
            };
        }

        let parsedIds = [];
        if (Array.isArray(rawIds)) {
            parsedIds = rawIds.map(id => Number(id));
        } else if (typeof rawIds === 'string') {
            parsedIds = rawIds.split(',').map(s => Number(s.trim()));
        } else if (typeof rawIds === 'number') {
            parsedIds = [rawIds];
        }

        const uniqueIds = Array.from(new Set(parsedIds.filter(id => !isNaN(id) && id > 0)));

        if (uniqueIds.length === 0) {
            return {
                count: 0,
                data: [],
                unavailable_ids: []
            };
        }

        const validPhones = [];
        const unavailableIds = [];

        for (const phoneId of uniqueIds) {
            const phone = await phoneRepository.findById(phoneId);

            // If phone doesn't exist, is archived, or status is ARCHIVED -> mark unavailable
            if (!phone || phone.is_archived || phone.status === 'ARCHIVED') {
                unavailableIds.push(phoneId);
                continue;
            }

            // Check active offer
            let activeOffer = {
                has_active_offer: false,
                offer_price: null,
                discount_percentage: 0,
                savings: 0
            };

            try {
                const offer = await offerRepository.findActiveOfferByPhoneId(phone.phone_id);
                if (offer) {
                    activeOffer = {
                        has_active_offer: true,
                        offer_id: offer.offer_id,
                        offer_title: offer.title,
                        regular_price: Number(offer.regular_price),
                        offer_price: Number(offer.offer_price),
                        discount_percentage: offer.discount_percentage,
                        savings: offer.discount_amount,
                        end_date_time: offer.end_date_time,
                        seconds_remaining: offer.seconds_remaining
                    };
                }
            } catch (err) { // eslint-disable-line no-unused-vars
                // Keep default
            }

            // Availability display label
            let availabilityLabel = phone.availability;
            if (phone.availability === 'SOLD_OUT') {
                availabilityLabel = 'Sold Out';
            } else if (phone.availability === 'LOW_STOCK') {
                availabilityLabel = `Only ${phone.current_stock} left`;
            } else if (phone.availability === 'IN_STOCK') {
                availabilityLabel = 'In Stock';
            } else if (phone.availability === 'COMING_SOON') {
                availabilityLabel = 'Coming Soon';
            }

            const mainPhoto = (Array.isArray(phone.photos) && phone.photos.length > 0)
                ? phone.photos[0]
                : null;

            const regularPrice = Number(phone.price);
            const effectivePrice = activeOffer.has_active_offer ? activeOffer.offer_price : regularPrice;

            validPhones.push({
                phone_id: phone.phone_id,
                name: phone.name,
                brand_id: phone.brand_id,
                brand_name: phone.brand_name || null,
                main_photo: mainPhoto,
                photos: Array.isArray(phone.photos) ? phone.photos : [],
                phone_condition: phone.phone_condition,
                regular_price: regularPrice,
                effective_price: effectivePrice,
                availability: phone.availability,
                availability_label: availabilityLabel,
                current_stock: phone.current_stock,
                warranty: phone.warranty || 'No warranty specified',
                colour_options: Array.isArray(phone.colour_options) ? phone.colour_options : [],
                active_offer: activeOffer,
                installment_enabled: Boolean(phone.installment_enabled),
                is_available: true
            });
        }

        return {
            count: validPhones.length,
            data: validPhones,
            unavailable_ids: unavailableIds
        };
    }
}

module.exports = new PhoneService();
