const AppError = require('../utils/customError');

const VALID_OFFER_STATUS = ['DRAFT', 'PUBLISHED'];

/**
 * Validates request payload for creating an offer
 */
function validateCreateOffer(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json header.', 400));
    }

    const {
        title,
        description,
        banner_image,
        phone_ids,
        regular_price,
        offer_price,
        start_date_time,
        end_date_time,
        status
    } = req.body;

    // title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return next(new AppError('Offer title is required and cannot be empty.', 400));
    }
    if (title.trim().length > 200) {
        return next(new AppError('Offer title cannot exceed 200 characters.', 400));
    }

    // description
    if (description !== undefined && description !== null && typeof description !== 'string') {
        return next(new AppError('description must be a string.', 400));
    }

    // banner_image
    if (banner_image !== undefined && banner_image !== null && typeof banner_image !== 'string') {
        return next(new AppError('banner_image must be a string (URL or path).', 400));
    }

    // phone_ids
    if (!phone_ids || !Array.isArray(phone_ids) || phone_ids.length === 0) {
        return next(new AppError('phone_ids is required and must be an array of at least one phone ID.', 400));
    }
    for (const pid of phone_ids) {
        if (isNaN(pid) || Number(pid) <= 0) {
            return next(new AppError(`Invalid phone ID '${pid}' in phone_ids array.`, 400));
        }
    }

    // regular_price
    if (regular_price === undefined || regular_price === null || isNaN(regular_price) || Number(regular_price) < 0) {
        return next(new AppError('regular_price is required and must be a non-negative number.', 400));
    }

    // offer_price
    if (offer_price === undefined || offer_price === null || isNaN(offer_price) || Number(offer_price) < 0) {
        return next(new AppError('offer_price is required and must be a non-negative number.', 400));
    }

    if (Number(offer_price) >= Number(regular_price)) {
        return next(new AppError('offer_price must be less than regular_price to represent a valid discount.', 400));
    }

    // start_date_time
    if (!start_date_time) {
        return next(new AppError('start_date_time is required.', 400));
    }
    const startDate = new Date(start_date_time);
    if (isNaN(startDate.getTime())) {
        return next(new AppError('start_date_time must be a valid date/time format (e.g. YYYY-MM-DDTHH:mm:ss).', 400));
    }

    // end_date_time
    if (!end_date_time) {
        return next(new AppError('end_date_time is required.', 400));
    }
    const endDate = new Date(end_date_time);
    if (isNaN(endDate.getTime())) {
        return next(new AppError('end_date_time must be a valid date/time format (e.g. YYYY-MM-DDTHH:mm:ss).', 400));
    }

    if (endDate <= startDate) {
        return next(new AppError('end_date_time must be later than start_date_time.', 400));
    }

    // status
    if (status !== undefined && status !== null) {
        const cleanStatus = String(status).trim().toUpperCase();
        if (!VALID_OFFER_STATUS.includes(cleanStatus)) {
            return next(new AppError(`Invalid status '${status}'. Allowed values: ${VALID_OFFER_STATUS.join(', ')}.`, 400));
        }
    }

    next();
}

/**
 * Validates request payload for updating an offer
 */
function validateUpdateOffer(req, res, next) {
    const { id } = req.params;
    if (!id || isNaN(id) || Number(id) <= 0) {
        return next(new AppError('Invalid offer ID parameter.', 400));
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('At least one field must be provided to update offer.', 400));
    }

    const {
        title,
        description,
        banner_image,
        phone_ids,
        regular_price,
        offer_price,
        start_date_time,
        end_date_time,
        status
    } = req.body;

    if (title !== undefined) {
        if (typeof title !== 'string' || title.trim().length === 0) {
            return next(new AppError('Offer title cannot be empty.', 400));
        }
        if (title.trim().length > 200) {
            return next(new AppError('Offer title cannot exceed 200 characters.', 400));
        }
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
        return next(new AppError('description must be a string.', 400));
    }

    if (banner_image !== undefined && banner_image !== null && typeof banner_image !== 'string') {
        return next(new AppError('banner_image must be a string.', 400));
    }

    if (phone_ids !== undefined) {
        if (!Array.isArray(phone_ids) || phone_ids.length === 0) {
            return next(new AppError('phone_ids must be a non-empty array of phone IDs.', 400));
        }
        for (const pid of phone_ids) {
            if (isNaN(pid) || Number(pid) <= 0) {
                return next(new AppError(`Invalid phone ID '${pid}' in phone_ids array.`, 400));
            }
        }
    }

    if (regular_price !== undefined) {
        if (isNaN(regular_price) || Number(regular_price) < 0) {
            return next(new AppError('regular_price must be a non-negative number.', 400));
        }
    }

    if (offer_price !== undefined) {
        if (isNaN(offer_price) || Number(offer_price) < 0) {
            return next(new AppError('offer_price must be a non-negative number.', 400));
        }
    }

    if (regular_price !== undefined && offer_price !== undefined) {
        if (Number(offer_price) >= Number(regular_price)) {
            return next(new AppError('offer_price must be less than regular_price.', 400));
        }
    }

    let startDate, endDate;
    if (start_date_time !== undefined) {
        startDate = new Date(start_date_time);
        if (isNaN(startDate.getTime())) {
            return next(new AppError('start_date_time must be a valid date format.', 400));
        }
    }

    if (end_date_time !== undefined) {
        endDate = new Date(end_date_time);
        if (isNaN(endDate.getTime())) {
            return next(new AppError('end_date_time must be a valid date format.', 400));
        }
    }

    if (startDate && endDate && endDate <= startDate) {
        return next(new AppError('end_date_time must be later than start_date_time.', 400));
    }

    if (status !== undefined && status !== null) {
        const cleanStatus = String(status).trim().toUpperCase();
        if (!VALID_OFFER_STATUS.includes(cleanStatus)) {
            return next(new AppError(`Invalid status '${status}'. Allowed values: ${VALID_OFFER_STATUS.join(', ')}.`, 400));
        }
    }

    next();
}

module.exports = {
    validateCreateOffer,
    validateUpdateOffer
};

