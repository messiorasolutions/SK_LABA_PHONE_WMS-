const AppError = require('../utils/customError');

/**
 * Validates request payload for creating a storage option
 */
function validateCreateStorageOption(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { storage_name, capacity_gb } = req.body;

    // Validate storage_name
    if (!storage_name || typeof storage_name !== 'string' || storage_name.trim().length === 0) {
        return next(new AppError('Storage name is required (e.g. "128GB", "256GB").', 400));
    }

    if (storage_name.trim().length > 30) {
        return next(new AppError('Storage name cannot exceed 30 characters.', 400));
    }

    // Validate capacity_gb
    if (capacity_gb === undefined || capacity_gb === null || isNaN(capacity_gb)) {
        return next(new AppError('capacity_gb is required and must be a positive integer in gigabytes.', 400));
    }

    const numericCapacity = Number(capacity_gb);
    if (!Number.isInteger(numericCapacity) || numericCapacity <= 0) {
        return next(new AppError('capacity_gb must be an integer greater than 0.', 400));
    }

    next();
}

/**
 * Validates request payload for updating a storage option
 */
function validateUpdateStorageOption(req, res, next) {
    const { id } = req.params;
    if (!id || isNaN(id) || Number(id) <= 0) {
        return next(new AppError('Invalid storage ID parameter.', 400));
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('At least one field (storage_name or capacity_gb) must be provided to update.', 400));
    }

    const { storage_name, capacity_gb } = req.body;

    if (storage_name !== undefined) {
        if (typeof storage_name !== 'string' || storage_name.trim().length === 0) {
            return next(new AppError('Storage name cannot be empty.', 400));
        }
        if (storage_name.trim().length > 30) {
            return next(new AppError('Storage name cannot exceed 30 characters.', 400));
        }
    }

    if (capacity_gb !== undefined) {
        if (capacity_gb === null || isNaN(capacity_gb)) {
            return next(new AppError('capacity_gb must be a valid positive integer.', 400));
        }
        const numericCapacity = Number(capacity_gb);
        if (!Number.isInteger(numericCapacity) || numericCapacity <= 0) {
            return next(new AppError('capacity_gb must be an integer greater than 0.', 400));
        }
    }

    next();
}

module.exports = {
    validateCreateStorageOption,
    validateUpdateStorageOption
};
