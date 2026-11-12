const AppError = require('../utils/customError');

const VALID_STATUSES = ['DRAFT', 'ONGOING', 'COMPLETED', 'CLOSED'];

function validateCreateGiveaway(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty.', 400));
    }

    const {
        title,
        short_description,
        description,
        thumbnail_url,
        start_date,
        end_date,
        winner_selection_date,
        status
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return next(new AppError('Giveaway title is required and cannot be empty.', 400));
    }
    if (title.trim().length > 255) {
        return next(new AppError('Giveaway title cannot exceed 255 characters.', 400));
    }

    if (short_description && typeof short_description === 'string' && short_description.length > 500) {
        return next(new AppError('Short description cannot exceed 500 characters.', 400));
    }

    if (!start_date || isNaN(Date.parse(start_date))) {
        return next(new AppError('A valid start date & time is required.', 400));
    }

    if (!end_date || isNaN(Date.parse(end_date))) {
        return next(new AppError('A valid end date & time is required.', 400));
    }

    if (new Date(end_date) <= new Date(start_date)) {
        return next(new AppError('End date must be after the start date.', 400));
    }

    if (!winner_selection_date || isNaN(Date.parse(winner_selection_date))) {
        return next(new AppError('A valid winner selection date is required.', 400));
    }

    if (status && !VALID_STATUSES.includes(String(status).trim().toUpperCase())) {
        return next(new AppError(`Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`, 400));
    }

    next();
}

function validateUpdateGiveaway(req, res, next) {
    const { id } = req.params;
    if (!id || isNaN(id) || Number(id) <= 0) {
        return next(new AppError('Invalid giveaway ID parameter.', 400));
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing.', 400));
    }

    const {
        title,
        start_date,
        end_date,
        winner_selection_date,
        status
    } = req.body;

    if (title !== undefined) {
        if (typeof title !== 'string' || title.trim().length === 0) {
            return next(new AppError('Giveaway title cannot be empty.', 400));
        }
        if (title.trim().length > 255) {
            return next(new AppError('Giveaway title cannot exceed 255 characters.', 400));
        }
    }

    if (start_date && isNaN(Date.parse(start_date))) {
        return next(new AppError('Invalid start date.', 400));
    }

    if (end_date && isNaN(Date.parse(end_date))) {
        return next(new AppError('Invalid end date.', 400));
    }

    if (winner_selection_date && isNaN(Date.parse(winner_selection_date))) {
        return next(new AppError('Invalid winner selection date.', 400));
    }

    if (status && !VALID_STATUSES.includes(String(status).trim().toUpperCase())) {
        return next(new AppError(`Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`, 400));
    }

    next();
}

function validatePublishWinners(req, res, next) {
    const { id } = req.params;
    if (!id || isNaN(id) || Number(id) <= 0) {
        return next(new AppError('Invalid giveaway ID parameter.', 400));
    }

    const { winners } = req.body;
    if (!Array.isArray(winners) || winners.length === 0) {
        return next(new AppError('At least one winner (name and email) is required.', 400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < winners.length; i++) {
        const w = winners[i];
        if (!w || !w.name || typeof w.name !== 'string' || !w.name.trim()) {
            return next(new AppError(`Winner #${i + 1} must have a valid name.`, 400));
        }
        if (!w.email || typeof w.email !== 'string' || !emailRegex.test(w.email.trim())) {
            return next(new AppError(`Winner #${i + 1} (${w.name}) must have a valid email address.`, 400));
        }
    }

    next();
}

module.exports = {
    validateCreateGiveaway,
    validateUpdateGiveaway,
    validatePublishWinners
};

