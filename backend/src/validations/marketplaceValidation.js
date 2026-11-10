/**
 * MarketplaceValidation
 * Validates request payloads and parameters across all Marketplace endpoints.
 */

const AppError = require('../utils/customError');

const POSITIVE_INT_REGEX = /^[1-9]\d*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_NUMBER_REGEX = /^[+]?[\d\s\-()]{7,25}$/;

const VALID_CONDITION_GRADES = [
    'BRAND_NEW',
    'LIKE_NEW',
    'EXCELLENT',
    'VERY_GOOD',
    'GOOD',
    'FAIR'
];

const VALID_LISTING_STATUSES = [
    'PENDING_REVIEW',
    'UNDER_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'REJECTED',
    'PUBLISHED',
    'RESERVED',
    'SOLD',
    'CANCELLED',
    'EXPIRED',
    'UNPUBLISHED'
];

/**
 * Validates :id parameter as a positive integer.
 */
function validateIdParam(paramName = 'id') {
    return (req, res, next) => {
        const val = req.params[paramName];
        if (!val || !POSITIVE_INT_REGEX.test(String(val).trim())) {
            return next(new AppError(`Invalid ${paramName}. Must be a positive integer.`, 400));
        }
        req.params[paramName] = parseInt(val, 10);
        next();
    };
}

const validateListingIdParam = validateIdParam('id');
const validateOrderIdParam = validateIdParam('id');

/**
 * Validates public Sell Your Phone listing submission.
 */
function validateSubmitListing(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty. Please send JSON or multipart form data.', 400));
    }

    const {
        seller_name,
        seller_email,
        seller_phone,
        brand,
        model,
        storage,
        color,
        condition,
        condition_grade,
        condition_description,
        price,
        seller_terms_accepted
    } = req.body;

    // Attach uploaded photos if passed through formidable middleware
    if (req.uploadedPhotos && Array.isArray(req.uploadedPhotos) && req.uploadedPhotos.length > 0) {
        req.body.photos = req.uploadedPhotos;
    }

    // 1. Seller Contact
    if (!seller_name || typeof seller_name !== 'string' || seller_name.trim().length === 0) {
        return next(new AppError('Seller name is required.', 400));
    }
    const cleanSellerName = seller_name.trim();
    if (cleanSellerName.length < 2 || cleanSellerName.length > 150) {
        return next(new AppError('Seller name must be between 2 and 150 characters.', 400));
    }

    if (!seller_email || typeof seller_email !== 'string' || seller_email.trim().length === 0) {
        return next(new AppError('Seller email is required.', 400));
    }
    const cleanSellerEmail = seller_email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanSellerEmail)) {
        return next(new AppError('Please provide a valid seller email address.', 400));
    }

    if (!seller_phone || typeof seller_phone !== 'string' || seller_phone.trim().length === 0) {
        return next(new AppError('Seller phone number is required.', 400));
    }
    const cleanSellerPhone = seller_phone.trim();
    const phoneDigits = cleanSellerPhone.replace(/\D/g, '');
    if (!PHONE_NUMBER_REGEX.test(cleanSellerPhone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
        return next(new AppError('Please provide a valid seller phone number containing 7 to 15 digits.', 400));
    }

    // 2. Device Specifications
    if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
        return next(new AppError('Phone brand is required.', 400));
    }
    if (!model || typeof model !== 'string' || model.trim().length === 0) {
        return next(new AppError('Phone model is required.', 400));
    }
    if (!storage || typeof storage !== 'string' || storage.trim().length === 0) {
        return next(new AppError('Storage capacity is required.', 400));
    }
    if (!color || typeof color !== 'string' || color.trim().length === 0) {
        return next(new AppError('Color is required.', 400));
    }

    if (!condition_description || typeof condition_description !== 'string' || condition_description.trim().length === 0) {
        return next(new AppError('Condition description is required.', 400));
    }
    const cleanDesc = condition_description.trim();
    if (cleanDesc.length < 5) {
        return next(new AppError('Condition description must be at least 5 characters.', 400));
    }

    // 3. Price
    if (price === undefined || price === null || String(price).trim() === '') {
        return next(new AppError('Selling price is required.', 400));
    }
    const priceStr = String(price).trim();
    const priceMatch = priceStr.match(/\d+(?:,\d{3})*(?:\.\d+)?/);
    const numericPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : NaN;
    if (isNaN(numericPrice) || numericPrice <= 0) {
        return next(new AppError('Selling price must be a valid positive number greater than zero.', 400));
    }

    // 4. Photos
    const photos = Array.isArray(req.body.photos) ? req.body.photos : [];
    if (photos.length === 0) {
        return next(new AppError('At least one device photo is required.', 400));
    }

    // 5. Terms
    const accepted = seller_terms_accepted === true || seller_terms_accepted === 'true' || seller_terms_accepted === 1;
    if (!accepted) {
        return next(new AppError('You must accept the Marketplace Seller Terms & Conditions.', 400));
    }

    // Sanitize body
    req.body.seller_name = cleanSellerName;
    req.body.seller_email = cleanSellerEmail;
    req.body.seller_phone = cleanSellerPhone;
    req.body.brand = brand.trim();
    req.body.model = model.trim();
    req.body.storage = storage.trim().toUpperCase();
    req.body.color = color.trim();
    req.body.condition_description = cleanDesc;
    req.body.price = Math.round(numericPrice * 100) / 100;
    req.body.seller_terms_accepted = true;

    next();
}

/**
 * Validates rejection request body.
 */
function validateRejectListing(req, res, next) {
    const { rejection_reason } = req.body || {};
    if (!rejection_reason || typeof rejection_reason !== 'string' || rejection_reason.trim().length === 0) {
        return next(new AppError('A valid rejection_reason is required to reject a marketplace listing.', 400));
    }
    if (rejection_reason.trim().length < 3 || rejection_reason.trim().length > 1000) {
        return next(new AppError('rejection_reason must be between 3 and 1000 characters.', 400));
    }
    req.body.rejection_reason = rejection_reason.trim();
    next();
}

/**
 * Validates request changes body.
 */
function validateRequestChanges(req, res, next) {
    const { changes_requested_reason } = req.body || {};
    if (!changes_requested_reason || typeof changes_requested_reason !== 'string' || changes_requested_reason.trim().length === 0) {
        return next(new AppError('A valid changes_requested_reason is required.', 400));
    }
    if (changes_requested_reason.trim().length < 3 || changes_requested_reason.trim().length > 1000) {
        return next(new AppError('changes_requested_reason must be between 3 and 1000 characters.', 400));
    }
    req.body.changes_requested_reason = changes_requested_reason.trim();
    next();
}

/**
 * Validates buyer order placement.
 */
function validateCreateOrder(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(new AppError('Request body is missing or empty.', 400));
    }

    const {
        listing_id,
        buyer_name,
        buyer_phone,
        buyer_email,
        buyer_address,
        buyer_terms_accepted
    } = req.body;

    if (!listing_id || !POSITIVE_INT_REGEX.test(String(listing_id).trim())) {
        return next(new AppError('Valid positive integer listing_id is required.', 400));
    }

    if (!buyer_name || typeof buyer_name !== 'string' || buyer_name.trim().length === 0) {
        return next(new AppError('Buyer full name is required.', 400));
    }
    if (buyer_name.trim().length < 2 || buyer_name.trim().length > 150) {
        return next(new AppError('Buyer name must be between 2 and 150 characters.', 400));
    }

    if (!buyer_phone || typeof buyer_phone !== 'string' || buyer_phone.trim().length === 0) {
        return next(new AppError('Buyer contact phone number is required.', 400));
    }
    const phoneDigits = buyer_phone.replace(/\D/g, '');
    if (!PHONE_NUMBER_REGEX.test(buyer_phone.trim()) || phoneDigits.length < 7 || phoneDigits.length > 15) {
        return next(new AppError('Please provide a valid buyer phone number containing 7 to 15 digits.', 400));
    }

    if (!buyer_email || typeof buyer_email !== 'string' || buyer_email.trim().length === 0) {
        return next(new AppError('Buyer email is required.', 400));
    }
    if (!EMAIL_REGEX.test(buyer_email.trim().toLowerCase())) {
        return next(new AppError('Please provide a valid buyer email address.', 400));
    }

    if (!buyer_address || typeof buyer_address !== 'string' || buyer_address.trim().length === 0) {
        return next(new AppError('Buyer delivery address is required.', 400));
    }

    const accepted = buyer_terms_accepted === true || buyer_terms_accepted === 'true' || buyer_terms_accepted === 1;
    if (!accepted) {
        return next(new AppError('You must accept the Marketplace Buyer Terms & Conditions.', 400));
    }

    req.body.listing_id = parseInt(listing_id, 10);
    req.body.buyer_name = buyer_name.trim();
    req.body.buyer_phone = buyer_phone.trim();
    req.body.buyer_email = buyer_email.trim().toLowerCase();
    req.body.buyer_address = buyer_address.trim();
    req.body.buyer_terms_accepted = true;

    next();
}

/**
 * Validates commission rate update.
 */
function validateUpdateCommission(req, res, next) {
    const { commission_percentage } = req.body || {};
    if (commission_percentage === undefined || commission_percentage === null) {
        return next(new AppError('commission_percentage is required.', 400));
    }
    const parsed = parseFloat(commission_percentage);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        return next(new AppError('commission_percentage must be a number between 0 and 100.', 400));
    }
    req.body.commission_percentage = Math.round(parsed * 100) / 100;
    next();
}

module.exports = {
    validateListingIdParam,
    validateOrderIdParam,
    validateSubmitListing,
    validateRejectListing,
    validateRequestChanges,
    validateCreateOrder,
    validateUpdateCommission,
    VALID_CONDITION_GRADES,
    VALID_LISTING_STATUSES
};
