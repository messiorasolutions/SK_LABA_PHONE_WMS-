const phoneRepository = require('../repositories/phoneRepository');
const brandRepository = require('../repositories/brandRepository');
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
}

module.exports = new PhoneService();
