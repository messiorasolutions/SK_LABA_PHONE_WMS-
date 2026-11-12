/**
 * MarketplaceRoutes
 * Defines public and administrative API routes for the Phone Marketplace.
 */

const express = require('express');
const defaultMarketplaceController = require('../controllers/marketplaceController');
const defaultAuthMiddleware = require('../middleware/authMiddleware');
const { handleMarketplaceUpload: defaultUploadMiddleware } = require('../middleware/marketplaceUploadMiddleware');
const {
    validateListingIdParam,
    validateOrderIdParam,
    validateSubmitListing,
    validateRejectListing,
    validateRequestChanges,
    validateCreateOrder,
    validateUpdateCommission
} = require('../validations/marketplaceValidation');

function createMarketplaceRouter({
    marketplaceController = defaultMarketplaceController,
    authMiddleware = defaultAuthMiddleware,
    uploadMiddleware = defaultUploadMiddleware
} = {}) {
    const router = express.Router();

    // ------------------------------------------------------------------------
    // 1. PUBLIC MARKETPLACE APIS
    // ------------------------------------------------------------------------

    // Public Sell Your Phone submission (Multipart or JSON)
    router.post(
        '/submit',
        uploadMiddleware,
        validateSubmitListing,
        (req, res, next) => marketplaceController.submitListing(req, res, next)
    );
    router.post(
        '/listings',
        uploadMiddleware,
        validateSubmitListing,
        (req, res, next) => marketplaceController.submitListing(req, res, next)
    );

    // Browse published Marketplace phones (Lightweight Smartphone-card format)
    router.get(
        '/phones',
        (req, res, next) => marketplaceController.getPublishedListings(req, res, next)
    );
    router.get(
        '/listings',
        (req, res, next) => marketplaceController.getPublishedListings(req, res, next)
    );

    // View published phone details
    router.get(
        '/phones/:id',
        validateListingIdParam,
        (req, res, next) => marketplaceController.getPublishedListingById(req, res, next)
    );

    // Public Platform Commission Rate
    router.get(
        '/commission',
        (req, res, next) => marketplaceController.getPublicCommission(req, res, next)
    );

    // Public Terms & Conditions
    router.get(
        '/terms/seller',
        (req, res, next) => marketplaceController.getActiveSellerTerms(req, res, next)
    );
    router.get(
        '/terms/buyer',
        (req, res, next) => marketplaceController.getActiveBuyerTerms(req, res, next)
    );

    // Public Order placement
    router.post(
        '/orders',
        validateCreateOrder,
        (req, res, next) => marketplaceController.createOrder(req, res, next)
    );

    // ------------------------------------------------------------------------
    // 2. PROTECTED ADMIN & STAFF APIS
    // ------------------------------------------------------------------------
    const staffOrAdmin = [authMiddleware.authenticate, authMiddleware.requireStaffOrAdmin];
    const adminOnly = [authMiddleware.authenticate, authMiddleware.requireAdmin];

    // Listing Management
    router.get(
        '/admin/listings',
        ...staffOrAdmin,
        (req, res, next) => marketplaceController.listAllListings(req, res, next)
    );

    router.get(
        '/admin/listings/:id',
        ...staffOrAdmin,
        validateListingIdParam,
        (req, res, next) => marketplaceController.getListingById(req, res, next)
    );

    router.patch(
        '/admin/listings/:id/under-review',
        ...staffOrAdmin,
        validateListingIdParam,
        (req, res, next) => marketplaceController.setUnderReview(req, res, next)
    );

    router.patch(
        '/admin/listings/:id/approve',
        ...staffOrAdmin,
        validateListingIdParam,
        (req, res, next) => marketplaceController.approveListing(req, res, next)
    );

    router.patch(
        '/admin/listings/:id/reject',
        ...staffOrAdmin,
        validateListingIdParam,
        validateRejectListing,
        (req, res, next) => marketplaceController.rejectListing(req, res, next)
    );

    router.patch(
        '/admin/listings/:id/request-changes',
        ...staffOrAdmin,
        validateListingIdParam,
        validateRequestChanges,
        (req, res, next) => marketplaceController.requestChanges(req, res, next)
    );

    router.patch(
        '/admin/listings/:id/unpublish',
        ...staffOrAdmin,
        validateListingIdParam,
        (req, res, next) => marketplaceController.unpublishListing(req, res, next)
    );

    router.patch(
        '/admin/listings/:id/sold',
        ...staffOrAdmin,
        validateListingIdParam,
        (req, res, next) => marketplaceController.markListingSold(req, res, next)
    );

    router.delete(
        '/admin/listings/:id',
        ...staffOrAdmin,
        validateListingIdParam,
        (req, res, next) => marketplaceController.deleteListing(req, res, next)
    );
    router.patch(
        '/admin/listings/:id/remove',
        ...staffOrAdmin,
        validateListingIdParam,
        (req, res, next) => marketplaceController.deleteListing(req, res, next)
    );

    // Order Management
    router.get(
        '/admin/orders',
        ...staffOrAdmin,
        (req, res, next) => marketplaceController.listOrders(req, res, next)
    );

    router.get(
        '/admin/orders/:id',
        ...staffOrAdmin,
        validateOrderIdParam,
        (req, res, next) => marketplaceController.getOrderById(req, res, next)
    );

    router.patch(
        '/admin/orders/:id/confirm-payment',
        ...staffOrAdmin,
        validateOrderIdParam,
        (req, res, next) => marketplaceController.confirmPayment(req, res, next)
    );

    router.patch(
        '/admin/orders/:id/notify-seller',
        ...staffOrAdmin,
        validateOrderIdParam,
        (req, res, next) => marketplaceController.notifySeller(req, res, next)
    );

    router.patch(
        '/admin/orders/:id/confirm-delivery',
        ...staffOrAdmin,
        validateOrderIdParam,
        (req, res, next) => marketplaceController.confirmDelivery(req, res, next)
    );

    router.patch(
        '/admin/orders/:id/verify-phone',
        ...staffOrAdmin,
        validateOrderIdParam,
        (req, res, next) => marketplaceController.verifyPhone(req, res, next)
    );

    router.patch(
        '/admin/orders/:id/verification-failed',
        ...staffOrAdmin,
        validateOrderIdParam,
        (req, res, next) => marketplaceController.markVerificationFailed(req, res, next)
    );

    router.patch(
        '/admin/orders/:id/release-payout',
        ...staffOrAdmin,
        validateOrderIdParam,
        (req, res, next) => marketplaceController.releaseSellerPayout(req, res, next)
    );

    router.patch(
        '/admin/orders/:id/complete',
        ...staffOrAdmin,
        validateOrderIdParam,
        (req, res, next) => marketplaceController.completeOrder(req, res, next)
    );

    router.patch(
        '/admin/orders/:id/cancel',
        ...staffOrAdmin,
        validateOrderIdParam,
        (req, res, next) => marketplaceController.cancelOrder(req, res, next)
    );

    // Commission Settings (ADMIN ONLY)
    router.get(
        '/admin/commission',
        ...adminOnly,
        (req, res, next) => marketplaceController.getCommissionRate(req, res, next)
    );

    router.put(
        '/admin/commission',
        ...adminOnly,
        validateUpdateCommission,
        (req, res, next) => marketplaceController.updateCommissionRate(req, res, next)
    );

    // Terms & Conditions (ADMIN ONLY)
    router.get(
        '/admin/terms',
        ...adminOnly,
        (req, res, next) => marketplaceController.listTermsHistory(req, res, next)
    );

    router.post(
        '/admin/terms',
        ...adminOnly,
        (req, res, next) => marketplaceController.createTermsVersion(req, res, next)
    );

    return router;
}

const defaultRouter = createMarketplaceRouter();

module.exports = defaultRouter;
module.exports.createMarketplaceRouter = createMarketplaceRouter;
