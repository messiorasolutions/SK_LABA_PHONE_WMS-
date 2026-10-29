const AppError = require('../utils/customError');

/**
 * Validates request payload for creating an installment plan
 */
function validateCreatePlan(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const { plan_name, number_of_months, interest_rate, additional_fee, terms, is_active } = req.body;

    // plan_name
    if (!plan_name || typeof plan_name !== 'string' || plan_name.trim().length === 0) {
        return next(new AppError('Plan name is required and cannot be empty.', 400));
    }
    if (plan_name.trim().length > 150) {
        return next(new AppError('Plan name cannot exceed 150 characters.', 400));
    }

    // number_of_months
    if (number_of_months === undefined || number_of_months === null || isNaN(number_of_months)) {
        return next(new AppError('number_of_months is required and must be a number.', 400));
    }
    const monthsNum = Number(number_of_months);
    if (!Number.isInteger(monthsNum) || monthsNum <= 0 || monthsNum > 120) {
        return next(new AppError('number_of_months must be an integer between 1 and 120.', 400));
    }

    // interest_rate
    if (interest_rate !== undefined && interest_rate !== null) {
        if (isNaN(interest_rate) || Number(interest_rate) < 0 || Number(interest_rate) > 100) {
            return next(new AppError('interest_rate must be a number between 0 and 100.', 400));
        }
    }

    // additional_fee
    if (additional_fee !== undefined && additional_fee !== null) {
        if (isNaN(additional_fee) || Number(additional_fee) < 0) {
            return next(new AppError('additional_fee must be a non-negative number.', 400));
        }
    }

    // terms
    if (terms !== undefined && terms !== null && typeof terms !== 'string') {
        return next(new AppError('terms must be a text string.', 400));
    }

    // is_active
    if (is_active !== undefined && is_active !== null) {
        if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
            return next(new AppError('is_active must be a boolean (true or false).', 400));
        }
    }

    next();
}

/**
 * Validates request payload for updating an installment plan
 */
function validateUpdatePlan(req, res, next) {
    const { id } = req.params;
    if (!id || isNaN(id) || Number(id) <= 0) {
        return next(new AppError('Invalid installment plan ID parameter.', 400));
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('At least one field must be provided to update installment plan.', 400));
    }

    const { plan_name, number_of_months, interest_rate, additional_fee, terms, is_active } = req.body;

    if (plan_name !== undefined) {
        if (typeof plan_name !== 'string' || plan_name.trim().length === 0) {
            return next(new AppError('Plan name cannot be empty.', 400));
        }
        if (plan_name.trim().length > 150) {
            return next(new AppError('Plan name cannot exceed 150 characters.', 400));
        }
    }

    if (number_of_months !== undefined) {
        if (isNaN(number_of_months)) {
            return next(new AppError('number_of_months must be a number.', 400));
        }
        const monthsNum = Number(number_of_months);
        if (!Number.isInteger(monthsNum) || monthsNum <= 0 || monthsNum > 120) {
            return next(new AppError('number_of_months must be an integer between 1 and 120.', 400));
        }
    }

    if (interest_rate !== undefined && interest_rate !== null) {
        if (isNaN(interest_rate) || Number(interest_rate) < 0 || Number(interest_rate) > 100) {
            return next(new AppError('interest_rate must be a number between 0 and 100.', 400));
        }
    }

    if (additional_fee !== undefined && additional_fee !== null) {
        if (isNaN(additional_fee) || Number(additional_fee) < 0) {
            return next(new AppError('additional_fee must be a non-negative number.', 400));
        }
    }

    if (terms !== undefined && terms !== null && typeof terms !== 'string') {
        return next(new AppError('terms must be a text string.', 400));
    }

    if (is_active !== undefined && is_active !== null) {
        if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
            return next(new AppError('is_active must be a boolean (true or false).', 400));
        }
    }

    next();
}

module.exports = {
    validateCreatePlan,
    validateUpdatePlan
};

