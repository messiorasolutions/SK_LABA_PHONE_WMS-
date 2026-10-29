const AppError = require('../utils/customError');

const VALID_CONDITIONS = ['NEW', 'USED'];
const VALID_AVAILABILITY = ['IN_STOCK', 'LOW_STOCK', 'SOLD_OUT', 'COMING_SOON'];
const VALID_STATUS = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

/**
 * Validates request payload for creating a phone
 */
function validateCreatePhone(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const {
        name,
        brand_id,
        phone_condition,
        price,
        storage_ids,
        colour_options,
        specification_ids,
        warranty,
        accessory_ids,
        description,
        low_stock_level,
        current_stock,
        stock_quantity,
        availability,
        installment_enabled,
        installment_plan_ids,
        status,
        is_archived,
        photos
    } = req.body;

    // name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return next(new AppError('Phone name is required and cannot be empty.', 400));
    }
    if (name.trim().length > 200) {
        return next(new AppError('Phone name cannot exceed 200 characters.', 400));
    }

    // brand_id
    if (!brand_id || isNaN(brand_id) || Number(brand_id) <= 0) {
        return next(new AppError('brand_id is required and must be a valid ID.', 400));
    }

    // phone_condition
    if (!phone_condition || typeof phone_condition !== 'string') {
        return next(new AppError("phone_condition is required. Allowed values: 'NEW' or 'USED'.", 400));
    }
    const cleanCondition = phone_condition.trim().toUpperCase();
    if (!VALID_CONDITIONS.includes(cleanCondition)) {
        return next(new AppError(`Invalid phone_condition '${phone_condition}'. Allowed values: 'NEW' or 'USED'.`, 400));
    }

    // price
    if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
        return next(new AppError('price is required and must be a non-negative number.', 400));
    }

    // JSON array fields validation
    if (storage_ids !== undefined && storage_ids !== null && !Array.isArray(storage_ids)) {
        return next(new AppError('storage_ids must be an array of storage IDs.', 400));
    }

    if (colour_options !== undefined && colour_options !== null && !Array.isArray(colour_options)) {
        return next(new AppError('colour_options must be an array of color names or objects.', 400));
    }

    if (specification_ids !== undefined && specification_ids !== null && !Array.isArray(specification_ids)) {
        return next(new AppError('specification_ids must be an array of specification IDs.', 400));
    }

    if (accessory_ids !== undefined && accessory_ids !== null && !Array.isArray(accessory_ids)) {
        return next(new AppError('accessory_ids must be an array of accessory IDs.', 400));
    }

    if (installment_plan_ids !== undefined && installment_plan_ids !== null && !Array.isArray(installment_plan_ids)) {
        return next(new AppError('installment_plan_ids must be an array of plan IDs.', 400));
    }

    if (photos !== undefined && photos !== null && !Array.isArray(photos)) {
        return next(new AppError('photos must be an array of image URLs.', 400));
    }

    // warranty
    if (warranty !== undefined && warranty !== null) {
        if (typeof warranty !== 'string') return next(new AppError('warranty must be a string.', 400));
        if (warranty.trim().length > 255) return next(new AppError('warranty cannot exceed 255 characters.', 400));
    }

    // description
    if (description !== undefined && description !== null && typeof description !== 'string') {
        return next(new AppError('description must be a string.', 400));
    }

    // low_stock_level
    const lowStockValue = low_stock_level !== undefined ? low_stock_level : stock_quantity;
    if (lowStockValue !== undefined && lowStockValue !== null) {
        if (isNaN(lowStockValue) || Number(lowStockValue) < 0 || !Number.isInteger(Number(lowStockValue))) {
            return next(new AppError('low_stock_level must be a non-negative integer.', 400));
        }
    }

    if (current_stock !== undefined && current_stock !== null) {
        if (isNaN(current_stock) || Number(current_stock) < 0 || !Number.isInteger(Number(current_stock))) {
            return next(new AppError('current_stock must be a non-negative integer.', 400));
        }
    }

    // current_stock
    if (current_stock !== undefined && current_stock !== null) {
        if (isNaN(current_stock) || Number(current_stock) < 0 || !Number.isInteger(Number(current_stock))) {
            return next(new AppError('current_stock must be a non-negative integer.', 400));
        }
    }

    // availability
    if (availability !== undefined && availability !== null) {
        const cleanAvail = String(availability).trim().toUpperCase();
        if (!VALID_AVAILABILITY.includes(cleanAvail)) {
            return next(new AppError(`Invalid availability '${availability}'. Allowed values: ${VALID_AVAILABILITY.join(', ')}.`, 400));
        }
    }

    // installment_enabled
    if (installment_enabled !== undefined && installment_enabled !== null) {
        if (typeof installment_enabled !== 'boolean' && installment_enabled !== 0 && installment_enabled !== 1) {
            return next(new AppError('installment_enabled must be a boolean (true or false).', 400));
        }
    }

    // status
    if (status !== undefined && status !== null) {
        const cleanStatus = String(status).trim().toUpperCase();
        if (!VALID_STATUS.includes(cleanStatus)) {
            return next(new AppError(`Invalid status '${status}'. Allowed values: ${VALID_STATUS.join(', ')}.`, 400));
        }
    }

    // is_archived
    if (is_archived !== undefined && is_archived !== null) {
        if (typeof is_archived !== 'boolean' && is_archived !== 0 && is_archived !== 1 && is_archived !== 'true' && is_archived !== 'false' && is_archived !== 'yes' && is_archived !== 'no') {
            return next(new AppError('is_archived must be a boolean or yes/no.', 400));
        }
    }

    next();
}

/**
 * Validates request payload for updating a phone
 */
function validateUpdatePhone(req, res, next) {
    const { id } = req.params;
    if (!id || isNaN(id) || Number(id) <= 0) {
        return next(new AppError('Invalid phone ID parameter.', 400));
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('At least one field must be provided to update phone.', 400));
    }

    const {
        name,
        brand_id,
        phone_condition,
        price,
        storage_ids,
        colour_options,
        specification_ids,
        warranty,
        accessory_ids,
        description,
        low_stock_level,
        current_stock,
        stock_quantity,
        availability,
        installment_enabled,
        installment_plan_ids,
        status,
        is_archived,
        photos
    } = req.body;

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            return next(new AppError('Phone name cannot be empty.', 400));
        }
        if (name.trim().length > 200) {
            return next(new AppError('Phone name cannot exceed 200 characters.', 400));
        }
    }

    if (brand_id !== undefined) {
        if (isNaN(brand_id) || Number(brand_id) <= 0) {
            return next(new AppError('brand_id must be a valid positive ID.', 400));
        }
    }

    if (phone_condition !== undefined) {
        const cleanCondition = String(phone_condition).trim().toUpperCase();
        if (!VALID_CONDITIONS.includes(cleanCondition)) {
            return next(new AppError(`Invalid phone_condition '${phone_condition}'. Allowed values: 'NEW' or 'USED'.`, 400));
        }
    }

    if (price !== undefined) {
        if (isNaN(price) || Number(price) < 0) {
            return next(new AppError('price must be a non-negative number.', 400));
        }
    }

    if (storage_ids !== undefined && storage_ids !== null && !Array.isArray(storage_ids)) {
        return next(new AppError('storage_ids must be an array of storage IDs.', 400));
    }

    if (colour_options !== undefined && colour_options !== null && !Array.isArray(colour_options)) {
        return next(new AppError('colour_options must be an array of color names or objects.', 400));
    }

    if (specification_ids !== undefined && specification_ids !== null && !Array.isArray(specification_ids)) {
        return next(new AppError('specification_ids must be an array of specification IDs.', 400));
    }

    if (accessory_ids !== undefined && accessory_ids !== null && !Array.isArray(accessory_ids)) {
        return next(new AppError('accessory_ids must be an array of accessory IDs.', 400));
    }

    if (installment_plan_ids !== undefined && installment_plan_ids !== null && !Array.isArray(installment_plan_ids)) {
        return next(new AppError('installment_plan_ids must be an array of plan IDs.', 400));
    }

    if (photos !== undefined && photos !== null && !Array.isArray(photos)) {
        return next(new AppError('photos must be an array of image URLs.', 400));
    }

    if (warranty !== undefined && warranty !== null) {
        if (typeof warranty !== 'string') return next(new AppError('warranty must be a string.', 400));
        if (warranty.trim().length > 255) return next(new AppError('warranty cannot exceed 255 characters.', 400));
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
        return next(new AppError('description must be a string.', 400));
    }

    const lowStockValue = low_stock_level !== undefined ? low_stock_level : stock_quantity;
    if (lowStockValue !== undefined && lowStockValue !== null) {
        if (isNaN(lowStockValue) || Number(lowStockValue) < 0 || !Number.isInteger(Number(lowStockValue))) {
            return next(new AppError('low_stock_level must be a non-negative integer.', 400));
        }
    }

    if (current_stock !== undefined && current_stock !== null) {
        if (isNaN(current_stock) || Number(current_stock) < 0 || !Number.isInteger(Number(current_stock))) {
            return next(new AppError('current_stock must be a non-negative integer.', 400));
        }
    }

    if (availability !== undefined && availability !== null) {
        const cleanAvail = String(availability).trim().toUpperCase();
        if (!VALID_AVAILABILITY.includes(cleanAvail)) {
            return next(new AppError(`Invalid availability '${availability}'. Allowed values: ${VALID_AVAILABILITY.join(', ')}.`, 400));
        }
    }

    if (installment_enabled !== undefined && installment_enabled !== null) {
        if (typeof installment_enabled !== 'boolean' && installment_enabled !== 0 && installment_enabled !== 1) {
            return next(new AppError('installment_enabled must be a boolean (true or false).', 400));
        }
    }

    if (status !== undefined && status !== null) {
        const cleanStatus = String(status).trim().toUpperCase();
        if (!VALID_STATUS.includes(cleanStatus)) {
            return next(new AppError(`Invalid status '${status}'. Allowed values: ${VALID_STATUS.join(', ')}.`, 400));
        }
    }

    if (is_archived !== undefined && is_archived !== null) {
        if (typeof is_archived !== 'boolean' && is_archived !== 0 && is_archived !== 1 && is_archived !== 'true' && is_archived !== 'false' && is_archived !== 'yes' && is_archived !== 'no') {
            return next(new AppError('is_archived must be a boolean or yes/no.', 400));
        }
    }

    next();
}

module.exports = {
    validateCreatePhone,
    validateUpdatePhone
};
