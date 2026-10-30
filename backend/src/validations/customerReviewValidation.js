const AppError = require('../utils/customError');

const VALID_MODERATION_STATUSES = ['Approved', 'Rejected'];
const VALID_LIST_STATUSES = ['Pending', 'Approved', 'Rejected', 'ALL'];

/**
 * Validates :id param for reviews
 */
function validateReviewIdParam(req, res, next) {
    const rawId = req.params.id;
    const numericId = Number(rawId);

    if (!rawId || isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
        return next(new AppError('Invalid review ID. It must be a positive integer.', 400));
    }

    req.params.id = numericId;
    next();
}

/**
 * Validates public customer review submission (POST /api/reviews)
 */
function validateCreateReview(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON data with Content-Type: application/json.', 400));
    }

    const {
        customer_name,
        name,
        rating,
        comment
    } = req.body;

    // 1. customer_name
    const rawName = customer_name !== undefined ? customer_name : name;
    if (rawName === undefined || rawName === null || typeof rawName !== 'string' || rawName.trim().length === 0) {
        return next(new AppError('customer_name is required and cannot be empty.', 400));
    }

    const cleanName = rawName.trim();
    if (cleanName.length < 2) {
        return next(new AppError('customer_name must be at least 2 characters.', 400));
    }
    if (cleanName.length > 150) {
        return next(new AppError('customer_name cannot exceed 150 characters.', 400));
    }

    // 2. rating (Must be whole integer between 1 and 5)
    if (rating === undefined || rating === null || rating === '') {
        return next(new AppError('rating is required.', 400));
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || typeof rating === 'boolean' || !Number.isInteger(numRating)) {
        return next(new AppError('rating must be a whole integer between 1 and 5.', 400));
    }

    if (numRating < 1 || numRating > 5) {
        return next(new AppError('rating must be between 1 and 5.', 400));
    }

    // 3. comment
    if (comment === undefined || comment === null || typeof comment !== 'string' || comment.trim().length === 0) {
        return next(new AppError('comment is required and cannot be empty.', 400));
    }

    const cleanComment = comment.trim();
    if (cleanComment.length < 3) {
        return next(new AppError('comment must be at least 3 characters.', 400));
    }
    if (cleanComment.length > 2000) {
        return next(new AppError('comment cannot exceed 2000 characters.', 400));
    }

    // Mass-assignment protection: explicitly sanitize req.body to safe customer inputs
    req.body = {
        customer_name: cleanName,
        rating: numRating,
        comment: cleanComment
    };

    next();
}

/**
 * Validates public approved reviews query params (GET /api/reviews)
 */
function validateListApprovedReviews(req, res, next) {
    const { page, limit } = req.query;

    let cleanPage = 1;
    if (page !== undefined && page !== null && page !== '') {
        const num = Number(page);
        if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
            return next(new AppError('page parameter must be a positive integer.', 400));
        }
        cleanPage = num;
    }

    let cleanLimit = 20;
    if (limit !== undefined && limit !== null && limit !== '') {
        const num = Number(limit);
        if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
            return next(new AppError('limit parameter must be a positive integer.', 400));
        }
        cleanLimit = Math.min(num, 50);
    }

    req.query.page = cleanPage;
    req.query.limit = cleanLimit;

    // Defense-in-depth: delete any user-provided status from public query
    delete req.query.status;

    next();
}

/**
 * Validates dashboard reviews query params (GET /api/admin/reviews)
 */
function validateListAdminReviews(req, res, next) {
    const { page, limit, status, search, sort_by, sort_order } = req.query;

    let cleanPage = 1;
    if (page !== undefined && page !== null && page !== '') {
        const num = Number(page);
        if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
            return next(new AppError('page parameter must be a positive integer.', 400));
        }
        cleanPage = num;
    }

    let cleanLimit = 20;
    if (limit !== undefined && limit !== null && limit !== '') {
        const num = Number(limit);
        if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
            return next(new AppError('limit parameter must be a positive integer.', 400));
        }
        cleanLimit = Math.min(num, 100);
    }

    let cleanStatus = 'ALL';
    if (status !== undefined && status !== null && String(status).trim().length > 0) {
        const normalized = String(status).trim();
        const matched = VALID_LIST_STATUSES.find((s) => s.toLowerCase() === normalized.toLowerCase());
        if (!matched) {
            return next(new AppError(`Invalid status filter '${status}'. Allowed values: ${VALID_LIST_STATUSES.join(', ')}.`, 400));
        }
        cleanStatus = matched;
    }

    let cleanSortBy = 'created_at';
    if (sort_by) {
        const allowedCols = ['created_at', 'rating', 'review_id', 'status', 'customer_name'];
        if (!allowedCols.includes(String(sort_by).trim().toLowerCase())) {
            return next(new AppError(`Invalid sort_by '${sort_by}'. Allowed values: ${allowedCols.join(', ')}.`, 400));
        }
        cleanSortBy = String(sort_by).trim().toLowerCase();
    }

    let cleanSortOrder = 'DESC';
    if (sort_order) {
        const upperOrder = String(sort_order).trim().toUpperCase();
        if (upperOrder !== 'ASC' && upperOrder !== 'DESC') {
            return next(new AppError("Invalid sort_order parameter. Allowed values: 'ASC' or 'DESC'.", 400));
        }
        cleanSortOrder = upperOrder;
    }

    req.query.page = cleanPage;
    req.query.limit = cleanLimit;
    req.query.status = cleanStatus;
    req.query.search = search && typeof search === 'string' ? search.trim() : null;
    req.query.sort_by = cleanSortBy;
    req.query.sort_order = cleanSortOrder;

    next();
}

/**
 * Validates dashboard review moderation status update (PATCH /api/admin/reviews/:id/status)
 */
function validateModerateReview(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
        return next(new AppError('Request body is missing. Please provide status.', 400));
    }

    const { status } = req.body;

    if (!status || typeof status !== 'string' || status.trim().length === 0) {
        return next(new AppError("status is required. Allowed values: 'Approved' or 'Rejected'.", 400));
    }

    const normalized = status.trim();
    const matched = VALID_MODERATION_STATUSES.find((s) => s.toLowerCase() === normalized.toLowerCase());

    if (!matched) {
        return next(new AppError(`Invalid moderation status '${status}'. Allowed values: ${VALID_MODERATION_STATUSES.join(', ')}.`, 400));
    }

    req.body = {
        status: matched
    };

    next();
}

module.exports = {
    validateReviewIdParam,
    validateCreateReview,
    validateListApprovedReviews,
    validateListAdminReviews,
    validateModerateReview
};
