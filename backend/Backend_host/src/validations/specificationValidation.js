const AppError = require('../utils/customError');

const VALID_SPEC_TYPES = ['TECHNICAL', 'ACCESSORY'];

/**
 * Validates payload for creating a specification
 */
function validateCreateSpecification(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { specification_name, specification_type, description, is_active } = req.body;

    // specification_name validation
    if (!specification_name || typeof specification_name !== 'string' || specification_name.trim().length === 0) {
        return next(new AppError('specification_name is required and cannot be empty.', 400));
    }
    if (specification_name.trim().length > 100) {
        return next(new AppError('specification_name cannot exceed 100 characters.', 400));
    }

    // specification_type validation
    if (!specification_type || typeof specification_type !== 'string') {
        return next(new AppError("specification_type is required. Allowed values: 'TECHNICAL' or 'ACCESSORY'.", 400));
    }
    const cleanType = specification_type.trim().toUpperCase();
    if (!VALID_SPEC_TYPES.includes(cleanType)) {
        return next(new AppError(`Invalid specification_type '${specification_type}'. Allowed values: 'TECHNICAL' or 'ACCESSORY'.`, 400));
    }

    // description validation
    if (description !== undefined && description !== null) {
        if (typeof description !== 'string') {
            return next(new AppError('description must be a string.', 400));
        }
        if (description.trim().length > 255) {
            return next(new AppError('description cannot exceed 255 characters.', 400));
        }
    }

    // is_active validation
    if (is_active !== undefined && is_active !== null) {
        if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
            return next(new AppError('is_active must be a boolean (true or false).', 400));
        }
    }

    next();
}

/**
 * Validates payload for updating a specification
 */
function validateUpdateSpecification(req, res, next) {
    const { id } = req.params;
    if (!id || isNaN(id) || Number(id) <= 0) {
        return next(new AppError('Invalid specification ID parameter.', 400));
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('At least one field (specification_name, specification_type, description, or is_active) must be provided to update.', 400));
    }

    const { specification_name, specification_type, description, is_active } = req.body;

    if (specification_name !== undefined) {
        if (typeof specification_name !== 'string' || specification_name.trim().length === 0) {
            return next(new AppError('specification_name cannot be empty.', 400));
        }
        if (specification_name.trim().length > 100) {
            return next(new AppError('specification_name cannot exceed 100 characters.', 400));
        }
    }

    if (specification_type !== undefined) {
        if (typeof specification_type !== 'string') {
            return next(new AppError("specification_type must be either 'TECHNICAL' or 'ACCESSORY'.", 400));
        }
        const cleanType = specification_type.trim().toUpperCase();
        if (!VALID_SPEC_TYPES.includes(cleanType)) {
            return next(new AppError(`Invalid specification_type '${specification_type}'. Allowed values: 'TECHNICAL' or 'ACCESSORY'.`, 400));
        }
    }

    if (description !== undefined && description !== null) {
        if (typeof description !== 'string') {
            return next(new AppError('description must be a string.', 400));
        }
        if (description.trim().length > 255) {
            return next(new AppError('description cannot exceed 255 characters.', 400));
        }
    }

    if (is_active !== undefined && is_active !== null) {
        if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
            return next(new AppError('is_active must be a boolean (true or false).', 400));
        }
    }

    next();
}

module.exports = {
    validateCreateSpecification,
    validateUpdateSpecification
};
