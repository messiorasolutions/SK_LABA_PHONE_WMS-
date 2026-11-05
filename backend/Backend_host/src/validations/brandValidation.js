const AppError = require('../utils/customError');

/**
 * Validates request payload for creating a brand
 */
function validateCreateBrand(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { brand_name, description, is_active } = req.body;

    if (!brand_name || typeof brand_name !== 'string' || brand_name.trim().length === 0) {
        return next(new AppError('Brand name is required and cannot be empty.', 400));
    }

    if (brand_name.trim().length > 100) {
        return next(new AppError('Brand name cannot exceed 100 characters.', 400));
    }

    if (description !== undefined && description !== null) {
        if (typeof description !== 'string') {
            return next(new AppError('Description must be a string.', 400));
        }
        if (description.trim().length > 255) {
            return next(new AppError('Description cannot exceed 255 characters.', 400));
        }
    }

    if (is_active !== undefined && is_active !== null) {
        if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
            return next(new AppError('is_active must be a boolean value (true or false).', 400));
        }
    }

    next();
}

/**
 * Validates request payload for updating a brand
 */
function validateUpdateBrand(req, res, next) {
    const { id } = req.params;
    if (!id || isNaN(id) || Number(id) <= 0) {
        return next(new AppError('Invalid brand ID parameter.', 400));
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('At least one field (brand_name, description, or is_active) must be provided to update.', 400));
    }

    const { brand_name, description, is_active } = req.body;

    if (brand_name !== undefined) {
        if (typeof brand_name !== 'string' || brand_name.trim().length === 0) {
            return next(new AppError('Brand name cannot be empty.', 400));
        }
        if (brand_name.trim().length > 100) {
            return next(new AppError('Brand name cannot exceed 100 characters.', 400));
        }
    }

    if (description !== undefined && description !== null) {
        if (typeof description !== 'string') {
            return next(new AppError('Description must be a string.', 400));
        }
        if (description.trim().length > 255) {
            return next(new AppError('Description cannot exceed 255 characters.', 400));
        }
    }

    if (is_active !== undefined && is_active !== null) {
        if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
            return next(new AppError('is_active must be a boolean value (true or false).', 400));
        }
    }

    next();
}

module.exports = {
    validateCreateBrand,
    validateUpdateBrand
};
