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
        const stockQty = data.stock_quantity !== undefined ? Number(data.stock_quantity) : 0;

        // Auto-assign availability if not explicitly passed
        let availability = data.availability ? data.availability.trim().toUpperCase() : null;
        if (!availability) {
            if (stockQty === 0) {
                availability = 'SOLD_OUT';
            } else if (stockQty <= 5) {
                availability = 'LOW_STOCK';
            } else {
                availability = 'IN_STOCK';
            }
        }

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
            stock_quantity: stockQty,
            availability,
            installment_enabled: Boolean(data.installment_enabled),
            installment_plan_ids: Array.isArray(data.installment_plan_ids) ? data.installment_plan_ids : null,
            status: data.status ? data.status.trim().toUpperCase() : 'DRAFT',
            photos: Array.isArray(data.photos) ? data.photos : null
        };

        const newPhone = await phoneRepository.create(phoneRecord);
        return newPhone;
    }

    /**
     * Retrieve all phones (with optional filters)
     * @param {Object} filters
     * @returns {Promise<Array>}
     */
    async getAllPhones(filters = {}) {
        return await phoneRepository.findAll(filters);
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
            stock_quantity: data.stock_quantity !== undefined ? Number(data.stock_quantity) : existing.stock_quantity,
            availability: data.availability !== undefined ? data.availability.trim().toUpperCase() : existing.availability,
            installment_enabled: data.installment_enabled !== undefined ? Boolean(data.installment_enabled) : Boolean(existing.installment_enabled),
            installment_plan_ids: data.installment_plan_ids !== undefined ? data.installment_plan_ids : existing.installment_plan_ids,
            status: data.status !== undefined ? data.status.trim().toUpperCase() : existing.status,
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
