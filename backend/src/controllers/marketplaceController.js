/**
 * MarketplaceController
 * Handles request parsing, invocation of marketplace services, and HTTP response formatting.
 */

const defaultListingService = require('../services/marketplaceListingService');
const defaultOrderService = require('../services/marketplaceOrderService');
const defaultCommissionService = require('../services/marketplaceCommissionService');
const defaultTermsService = require('../services/marketplaceTermsService');
const defaultAuditService = require('../services/marketplaceAuditService');
const AppError = require('../utils/customError');

class MarketplaceController {
    constructor({
        listingService = defaultListingService,
        orderService = defaultOrderService,
        commissionService = defaultCommissionService,
        termsService = defaultTermsService,
        auditService = defaultAuditService
    } = {}) {
        this.listingService = listingService;
        this.orderService = orderService;
        this.commissionService = commissionService;
        this.termsService = termsService;
        this.auditService = auditService;
    }

    /**
     * POST /api/marketplace/submit (or /api/marketplace/listings)
     * Public Seller Submission (Sell Your Phone)
     */
    async submitListing(req, res, next) {
        try {
            const ipAddress = req.ip || req.connection.remoteAddress;
            const authenticatedUserId = req.user ? req.user.user_id : null;

            const result = await this.listingService.submitListing(req.body, {
                ipAddress,
                authenticatedUserId
            });

            return res.status(201).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/marketplace/phones (or /api/marketplace/listings)
     * Public Marketplace browsing (PUBLISHED ONLY)
     */
    async getPublishedListings(req, res, next) {
        try {
            const result = await this.listingService.getPublishedListings(req.query);
            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/marketplace/phones/:id
     * Public Marketplace detail view
     */
    async getPublishedListingById(req, res, next) {
        try {
            const phone = await this.listingService.getPublishedListingById(req.params.id);
            return res.status(200).json({
                success: true,
                data: phone
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/marketplace/terms/seller
     * Public active Seller Terms & Conditions
     */
    async getActiveSellerTerms(req, res, next) {
        try {
            const terms = await this.termsService.getActiveTerms('SELLER');
            const commissionRate = await this.commissionService.getCommissionRate().catch(() => 5.00);
            return res.status(200).json({
                success: true,
                data: {
                    ...terms,
                    commission_percentage: commissionRate
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/marketplace/commission
     * Public platform commission rate
     */
    async getPublicCommission(req, res, next) {
        try {
            const rate = await this.commissionService.getCommissionRate().catch(() => 5.00);
            return res.status(200).json({
                success: true,
                data: { commission_percentage: rate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/marketplace/terms/buyer
     * Public active Buyer Terms & Conditions
     */
    async getActiveBuyerTerms(req, res, next) {
        try {
            const terms = await this.termsService.getActiveTerms('BUYER');
            return res.status(200).json({
                success: true,
                data: terms
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/marketplace/orders
     * Public Buyer Order Placement
     */
    async createOrder(req, res, next) {
        try {
            const ipAddress = req.ip || req.connection.remoteAddress;
            const authenticatedUserId = req.user ? req.user.user_id : null;

            const order = await this.orderService.createOrder(req.body, {
                ipAddress,
                authenticatedUserId
            });

            return res.status(201).json({
                success: true,
                message: 'Marketplace order created successfully. Please complete payment to reserve device.',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // ADMIN LISTING MANAGEMENT (ADMIN & STAFF)
    // ==========================================

    /**
     * GET /api/marketplace/admin/listings
     */
    async listAllListings(req, res, next) {
        try {
            const result = await this.listingService.listAllListings(req.query);
            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/marketplace/admin/listings/:id
     */
    async getListingById(req, res, next) {
        try {
            const listing = await this.listingService.getListingById(req.params.id);
            const history = await this.auditService.getEntityHistory('LISTING', req.params.id);
            return res.status(200).json({
                success: true,
                data: {
                    ...listing,
                    audit_history: history
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/listings/:id/under-review
     */
    async setUnderReview(req, res, next) {
        try {
            const updated = await this.listingService.setUnderReview(req.params.id, req.user.user_id);
            return res.status(200).json({
                success: true,
                message: 'Listing marked as UNDER_REVIEW',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/listings/:id/approve
     */
    async approveListing(req, res, next) {
        try {
            const { admin_notes, autoPublish = true } = req.body || {};
            const result = await this.listingService.approveListing(req.params.id, req.user.user_id, {
                admin_notes,
                autoPublish: autoPublish !== false
            });
            return res.status(200).json({
                success: true,
                message: 'Marketplace listing approved successfully and published to catalogue',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/listings/:id/reject
     */
    async rejectListing(req, res, next) {
        try {
            const { rejection_reason, admin_notes } = req.body;
            const updated = await this.listingService.rejectListing(req.params.id, req.user.user_id, {
                rejection_reason,
                admin_notes
            });
            return res.status(200).json({
                success: true,
                message: 'Marketplace listing rejected',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/listings/:id/request-changes
     */
    async requestChanges(req, res, next) {
        try {
            const { changes_requested_reason, admin_notes } = req.body;
            const updated = await this.listingService.requestChanges(req.params.id, req.user.user_id, {
                changes_requested_reason,
                admin_notes
            });
            return res.status(200).json({
                success: true,
                message: 'Changes requested notification dispatched to seller',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/listings/:id/unpublish
     */
    async unpublishListing(req, res, next) {
        try {
            const { admin_notes } = req.body || {};
            const updated = await this.listingService.unpublishListing(req.params.id, req.user.user_id, {
                admin_notes
            });
            return res.status(200).json({
                success: true,
                message: 'Listing unpublished and hidden from public catalogue',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/listings/:id/sold
     * Mark listing as SOLD and remove from active Marketplace
     */
    async markListingSold(req, res, next) {
        try {
            const { sold_price, admin_notes } = req.body || {};
            const updated = await this.listingService.markListingSold(req.params.id, req.user.user_id, {
                sold_price,
                admin_notes
            });
            return res.status(200).json({
                success: true,
                message: 'Listing marked as SOLD and removed from active marketplace',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/marketplace/admin/listings/:id
     * Remove / delete listing from marketplace
     */
    async deleteListing(req, res, next) {
        try {
            const { reason } = req.body || req.query || {};
            const updated = await this.listingService.deleteListing(req.params.id, req.user.user_id, {
                reason
            });
            return res.status(200).json({
                success: true,
                message: 'Listing removed from marketplace',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // ADMIN ORDER MANAGEMENT & WORKFLOW
    // ==========================================

    /**
     * GET /api/marketplace/admin/orders
     */
    async listOrders(req, res, next) {
        try {
            const result = await this.orderService.listOrders(req.query);
            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/marketplace/admin/orders/:id
     */
    async getOrderById(req, res, next) {
        try {
            const order = await this.orderService.getOrderById(req.params.id);
            const history = await this.auditService.getEntityHistory('ORDER', req.params.id);
            return res.status(200).json({
                success: true,
                data: {
                    ...order,
                    audit_history: history
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/orders/:id/confirm-payment
     */
    async confirmPayment(req, res, next) {
        try {
            const { payment_reference } = req.body || {};
            const updated = await this.orderService.confirmPayment(req.params.id, req.user.user_id, {
                payment_reference
            });
            return res.status(200).json({
                success: true,
                message: 'Buyer payment confirmed',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/orders/:id/notify-seller
     */
    async notifySeller(req, res, next) {
        try {
            const updated = await this.orderService.notifySeller(req.params.id, req.user.user_id);
            return res.status(200).json({
                success: true,
                message: 'Seller notified for direct delivery',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/orders/:id/confirm-delivery
     * (Manual confirmation after buyer WhatsApp message)
     */
    async confirmDelivery(req, res, next) {
        try {
            const { confirmation_note } = req.body || {};
            const updated = await this.orderService.confirmDelivery(req.params.id, req.user.user_id, {
                confirmation_note
            });
            return res.status(200).json({
                success: true,
                message: 'Delivery confirmed from buyer communication',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/orders/:id/verify-phone
     */
    async verifyPhone(req, res, next) {
        try {
            const { verification_note } = req.body || {};
            const updated = await this.orderService.verifyPhone(req.params.id, req.user.user_id, {
                verification_note
            });
            return res.status(200).json({
                success: true,
                message: 'Device verification completed',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/orders/:id/verification-failed
     */
    async markVerificationFailed(req, res, next) {
        try {
            const { verification_note } = req.body || {};
            const updated = await this.orderService.markVerificationFailed(req.params.id, req.user.user_id, {
                verification_note
            });
            return res.status(200).json({
                success: true,
                message: 'Device verification marked as failed',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/orders/:id/release-payout
     */
    async releaseSellerPayout(req, res, next) {
        try {
            const { payout_reference } = req.body || {};
            const updated = await this.orderService.releaseSellerPayout(req.params.id, req.user.user_id, {
                payout_reference
            });
            return res.status(200).json({
                success: true,
                message: 'Seller payment released successfully based on order financial snapshot',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/orders/:id/complete
     */
    async completeOrder(req, res, next) {
        try {
            const updated = await this.orderService.completeOrder(req.params.id, req.user.user_id);
            return res.status(200).json({
                success: true,
                message: 'Order completed and phone marked as SOLD',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/marketplace/admin/orders/:id/cancel
     */
    async cancelOrder(req, res, next) {
        try {
            const { cancellation_reason } = req.body || {};
            const updated = await this.orderService.cancelOrder(req.params.id, req.user.user_id, {
                cancellation_reason
            });
            return res.status(200).json({
                success: true,
                message: 'Order cancelled and listing restored to PUBLISHED',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // COMMISSION & SETTINGS (ADMIN ONLY)
    // ==========================================

    /**
     * GET /api/marketplace/admin/commission
     */
    async getCommissionRate(req, res, next) {
        try {
            const rate = await this.commissionService.getCommissionRate();
            return res.status(200).json({
                success: true,
                data: { commission_percentage: rate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/marketplace/admin/commission
     */
    async updateCommissionRate(req, res, next) {
        try {
            const result = await this.commissionService.updateCommissionRate(
                req.body.commission_percentage,
                req.user.user_id
            );
            return res.status(200).json({
                success: true,
                message: 'Platform commission percentage updated successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/marketplace/admin/terms
     */
    async listTermsHistory(req, res, next) {
        try {
            const terms = await this.termsService.listTermsHistory(req.query.term_type);
            return res.status(200).json({
                success: true,
                data: terms
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/marketplace/admin/terms
     */
    async createTermsVersion(req, res, next) {
        try {
            const newTerms = await this.termsService.createTermsVersion(req.body, req.user.user_id);
            return res.status(201).json({
                success: true,
                message: 'New terms & conditions version published successfully',
                data: newTerms
            });
        } catch (error) {
            next(error);
        }
    }
}

const defaultMarketplaceController = new MarketplaceController();

module.exports = defaultMarketplaceController;
module.exports.MarketplaceController = MarketplaceController;
