/**
 * MarketplaceOrderService
 * Manages the entire lifecycle of Marketplace Orders, direct Seller-to-Buyer delivery,
 * manual WhatsApp delivery confirmations, phone verifications, and financial payout releases.
 *
 * NOTE: As per strict business requirements, the status 'NO_INTERMEDIATE_PAYOUT_STATUS'
 * DOES NOT EXIST and must never be used.
 */

const defaultOrderRepo = require('../repositories/marketplaceOrderRepository');
const defaultListingRepo = require('../repositories/marketplaceListingRepository');
const defaultCommissionService = require('./marketplaceCommissionService');
const defaultTermsService = require('./marketplaceTermsService');
const defaultAuditService = require('./marketplaceAuditService');
const defaultPool = require('../config/db');
const AppError = require('../utils/customError');

class MarketplaceOrderService {
    constructor({
        orderRepository = defaultOrderRepo,
        listingRepository = defaultListingRepo,
        commissionService = defaultCommissionService,
        termsService = defaultTermsService,
        auditService = defaultAuditService,
        pool = defaultPool
    } = {}) {
        this.orderRepo = orderRepository;
        this.listingRepo = listingRepository;
        this.commissionService = commissionService;
        this.termsService = termsService;
        this.auditService = auditService;
        this.pool = pool;
    }

    /**
     * Buyer places order for a PUBLISHED Marketplace phone.
     * Takes an immutable financial snapshot.
     */
    async createOrder(data, { ipAddress = null, authenticatedUserId = null } = {}) {
        const {
            listing_id,
            buyer_name,
            buyer_phone,
            buyer_email,
            buyer_address,
            buyer_terms_accepted
        } = data;

        if (!listing_id) {
            throw new AppError('Marketplace listing_id is required.', 400);
        }
        if (!buyer_name || typeof buyer_name !== 'string' || buyer_name.trim().length === 0) {
            throw new AppError('Buyer full name is required.', 400);
        }
        if (!buyer_phone || typeof buyer_phone !== 'string' || buyer_phone.trim().length < 7) {
            throw new AppError('Buyer contact phone number is required.', 400);
        }
        if (!buyer_email || typeof buyer_email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email.trim())) {
            throw new AppError('A valid buyer email address is required.', 400);
        }
        if (!buyer_address || typeof buyer_address !== 'string' || buyer_address.trim().length === 0) {
            throw new AppError('Buyer delivery address is required.', 400);
        }
        if (buyer_terms_accepted !== true && buyer_terms_accepted !== 'true' && buyer_terms_accepted !== 1) {
            throw new AppError('You must accept the Marketplace Buyer Terms & Conditions.', 400);
        }

        const listing = await this.listingRepo.findById(listing_id);
        if (!listing) {
            throw new AppError('Marketplace listing not found.', 404);
        }
        if (listing.status !== 'PUBLISHED') {
            throw new AppError('This marketplace phone is no longer available for purchase.', 400);
        }

        // 1. Calculate and lock permanent financial snapshot
        const financials = await this.commissionService.calculateFinancials(listing.price);
        const activeTerms = await this.termsService.getActiveTerms('BUYER');

        const connection = await this.pool.getConnection();
        let order;

        try {
            await connection.beginTransaction();

            // 2. Mark listing as RESERVED while payment is pending
            await this.listingRepo.updateStatus(listing_id, {
                status: 'RESERVED'
            }, connection);

            // Update linked Smartphone catalog stock to 0 / SOLD_OUT while reserved
            await connection.query(
                `UPDATE phones SET availability = 'SOLD_OUT', current_stock = 0 WHERE marketplace_listing_id = ?`,
                [Number(listing_id)]
            );

            // 3. Insert order with permanent financial snapshot
            order = await this.orderRepo.create({
                listing_id: listing.listing_id,
                seller_id: listing.seller_id || null,
                seller_name: listing.seller_name,
                seller_email: listing.seller_email,
                seller_phone: listing.seller_phone,
                buyer_id: authenticatedUserId || null,
                buyer_name: buyer_name.trim(),
                buyer_phone: buyer_phone.trim(),
                buyer_email: buyer_email.trim().toLowerCase(),
                buyer_address: buyer_address.trim(),
                selling_price: financials.selling_price,
                commission_rate: financials.commission_rate,
                commission_amount: financials.commission_amount,
                seller_payout: financials.seller_payout,
                buyer_terms_version: activeTerms.version || '1.0',
                order_status: 'PENDING_PAYMENT'
            }, connection);

            // 4. Audit Log
            await this.auditService.log({
                entityType: 'ORDER',
                entityId: order.order_id,
                action: 'ORDER_CREATED',
                actorUserId: authenticatedUserId || null,
                actorRole: 'BUYER',
                details: {
                    order_number: order.order_number,
                    selling_price: financials.selling_price,
                    commission_amount: financials.commission_amount,
                    seller_payout: financials.seller_payout
                },
                ipAddress
            }, connection);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return order;
    }

    /**
     * Retrieve order by ID
     */
    async getOrderById(orderId) {
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
            throw new AppError('Marketplace order not found.', 404);
        }
        return order;
    }

    /**
     * List all marketplace orders for admin management
     */
    async listOrders(filters = {}) {
        return await this.orderRepo.findOrders(filters);
    }

    /**
     * Admin Action: Confirm Buyer Payment (Full Selling Price received by SK LABA PHONE)
     */
    async confirmPayment(orderId, adminUserId, { payment_reference = null } = {}) {
        const order = await this.getOrderById(orderId);
        if (order.order_status !== 'PENDING_PAYMENT') {
            throw new AppError(`Cannot confirm payment for order in status '${order.order_status}'.`, 400);
        }

        const updated = await this.orderRepo.updateStatus(orderId, {
            order_status: 'PAYMENT_RECEIVED',
            payment_confirmed_at: new Date(),
            payment_confirmed_by: adminUserId,
            payment_reference: payment_reference || 'MANUAL_VERIFIED'
        });

        await this.auditService.log({
            entityType: 'ORDER',
            entityId: orderId,
            action: 'PAYMENT_CONFIRMED',
            actorUserId: adminUserId,
            actorRole: 'ADMIN',
            details: { payment_reference }
        });

        return updated;
    }

    /**
     * Admin Action: Notify Seller to dispatch/deliver phone directly to buyer
     */
    async notifySeller(orderId, adminUserId) {
        const order = await this.getOrderById(orderId);
        if (order.order_status !== 'PAYMENT_RECEIVED') {
            throw new AppError(`Cannot notify seller for order in status '${order.order_status}'. Payment must be received first.`, 400);
        }

        const updated = await this.orderRepo.updateStatus(orderId, {
            order_status: 'AWAITING_PHONE_DELIVERY',
            seller_notified_at: new Date(),
            seller_notified_by: adminUserId
        });

        await this.auditService.log({
            entityType: 'ORDER',
            entityId: orderId,
            action: 'SELLER_NOTIFIED',
            actorUserId: adminUserId,
            actorRole: 'ADMIN',
            details: { seller_email: order.seller_email }
        });

        return updated;
    }

    /**
     * Admin Action: Mark Delivery Confirmed
     * Triggered manually after buyer confirms receipt via WhatsApp channel.
     */
    async confirmDelivery(orderId, adminUserId, { confirmation_note = 'Buyer confirmed delivery through WhatsApp.' } = {}) {
        const order = await this.getOrderById(orderId);
        if (order.order_status !== 'AWAITING_PHONE_DELIVERY' && order.order_status !== 'SELLER_NOTIFIED') {
            throw new AppError(`Cannot confirm delivery for order in status '${order.order_status}'. Must be AWAITING_PHONE_DELIVERY.`, 400);
        }

        const note = confirmation_note && typeof confirmation_note === 'string' && confirmation_note.trim().length > 0
            ? confirmation_note.trim()
            : 'Buyer confirmed delivery through WhatsApp.';

        const updated = await this.orderRepo.updateStatus(orderId, {
            order_status: 'DELIVERY_CONFIRMED',
            delivery_confirmed_at: new Date(),
            delivery_confirmed_by: adminUserId,
            delivery_confirmation_note: note
        });

        await this.auditService.log({
            entityType: 'ORDER',
            entityId: orderId,
            action: 'DELIVERY_CONFIRMED',
            actorUserId: adminUserId,
            actorRole: 'ADMIN',
            details: { confirmation_note: note }
        });

        return updated;
    }

    /**
     * Admin Action: Mark Phone Verified
     * After delivery confirmation, Admin completes device condition verification.
     */
    async verifyPhone(orderId, adminUserId, { verification_note = 'Device condition verified and matched description.' } = {}) {
        const order = await this.getOrderById(orderId);
        if (order.order_status !== 'DELIVERY_CONFIRMED') {
            throw new AppError(`Cannot verify phone for order in status '${order.order_status}'. Delivery must be confirmed first.`, 400);
        }

        const note = verification_note && typeof verification_note === 'string' && verification_note.trim().length > 0
            ? verification_note.trim()
            : 'Device condition verified and matched description.';

        const updated = await this.orderRepo.updateStatus(orderId, {
            order_status: 'PHONE_VERIFIED',
            phone_verified_at: new Date(),
            phone_verified_by: adminUserId,
            phone_verification_note: note
        });

        await this.auditService.log({
            entityType: 'ORDER',
            entityId: orderId,
            action: 'PHONE_VERIFIED',
            actorUserId: adminUserId,
            actorRole: 'ADMIN',
            details: { verification_note: note }
        });

        return updated;
    }

    /**
     * Admin Action: Mark Verification Failed
     */
    async markVerificationFailed(orderId, adminUserId, { verification_note } = {}) {
        const order = await this.getOrderById(orderId);
        if (order.order_status !== 'DELIVERY_CONFIRMED') {
            throw new AppError(`Cannot fail verification for order in status '${order.order_status}'. Delivery must be confirmed first.`, 400);
        }

        const note = verification_note && typeof verification_note === 'string' && verification_note.trim().length > 0
            ? verification_note.trim()
            : 'Device condition did not match description.';

        const updated = await this.orderRepo.updateStatus(orderId, {
            order_status: 'VERIFICATION_FAILED',
            phone_verified_at: new Date(),
            phone_verified_by: adminUserId,
            phone_verification_note: note
        });

        await this.auditService.log({
            entityType: 'ORDER',
            entityId: orderId,
            action: 'VERIFICATION_FAILED',
            actorUserId: adminUserId,
            actorRole: 'ADMIN',
            details: { verification_note: note }
        });

        return updated;
    }

    /**
     * Admin Action: Release Seller Payout
     * Allowed ONLY after PHONE_VERIFIED. Payout uses frozen financial snapshot.
     */
    async releaseSellerPayout(orderId, adminUserId, { payout_reference = null } = {}) {
        const order = await this.getOrderById(orderId);

        // Strict validation: must be PHONE_VERIFIED
        if (order.order_status !== 'PHONE_VERIFIED') {
            throw new AppError(`Cannot release payout for order in status '${order.order_status}'. Payout requires status PHONE_VERIFIED.`, 400);
        }

        const updated = await this.orderRepo.updateStatus(orderId, {
            order_status: 'SELLER_PAID',
            seller_paid_at: new Date(),
            seller_paid_by: adminUserId,
            seller_payout_reference: payout_reference || `PAYOUT-REF-${Date.now()}`
        });

        await this.auditService.log({
            entityType: 'ORDER',
            entityId: orderId,
            action: 'SELLER_PAYMENT_RELEASED',
            actorUserId: adminUserId,
            actorRole: 'ADMIN',
            details: {
                seller_payout: order.seller_payout,
                commission_retained: order.commission_amount,
                payout_reference: updated.seller_payout_reference
            }
        });

        return updated;
    }

    /**
     * Admin Action: Complete Order
     * Allowed after SELLER_PAID. Listing transitions to SOLD.
     */
    async completeOrder(orderId, adminUserId) {
        const order = await this.getOrderById(orderId);
        if (order.order_status !== 'SELLER_PAID') {
            throw new AppError(`Cannot complete order in status '${order.order_status}'. Payout must be released first.`, 400);
        }

        const connection = await this.pool.getConnection();
        let updated;

        try {
            await connection.beginTransaction();

            updated = await this.orderRepo.updateStatus(orderId, {
                order_status: 'COMPLETED',
                completed_at: new Date()
            }, connection);

            // Mark marketplace listing as SOLD
            await this.listingRepo.updateStatus(order.listing_id, {
                status: 'SOLD'
            }, connection);

            // Mark linked Smartphone catalog record as SOLD_OUT / stock 0
            await connection.query(
                `UPDATE phones SET availability = 'SOLD_OUT', current_stock = 0 WHERE marketplace_listing_id = ?`,
                [Number(order.listing_id)]
            );

            await this.auditService.log({
                entityType: 'ORDER',
                entityId: orderId,
                action: 'ORDER_COMPLETED',
                actorUserId: adminUserId,
                actorRole: 'ADMIN'
            }, connection);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return updated;
    }

    /**
     * Admin Action: Cancel Order
     * Reverts listing to PUBLISHED and Smartphone stock to IN_STOCK.
     */
    async cancelOrder(orderId, adminUserId, { cancellation_reason = null } = {}) {
        const order = await this.getOrderById(orderId);
        if (order.order_status === 'COMPLETED' || order.order_status === 'SELLER_PAID') {
            throw new AppError(`Cannot cancel order in status '${order.order_status}'.`, 400);
        }

        const connection = await this.pool.getConnection();
        let updated;

        try {
            await connection.beginTransaction();

            updated = await this.orderRepo.updateStatus(orderId, {
                order_status: 'CANCELLED',
                cancelled_at: new Date(),
                cancelled_by: adminUserId,
                cancellation_reason: cancellation_reason || 'Cancelled by administrator'
            }, connection);

            // Revert listing to PUBLISHED
            await this.listingRepo.updateStatus(order.listing_id, {
                status: 'PUBLISHED'
            }, connection);

            // Revert linked Smartphone catalog to IN_STOCK / stock 1
            await connection.query(
                `UPDATE phones SET availability = 'IN_STOCK', current_stock = 1 WHERE marketplace_listing_id = ?`,
                [Number(order.listing_id)]
            );

            await this.auditService.log({
                entityType: 'ORDER',
                entityId: orderId,
                action: 'ORDER_CANCELLED',
                actorUserId: adminUserId,
                actorRole: 'ADMIN',
                details: { cancellation_reason }
            }, connection);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return updated;
    }
}

const defaultMarketplaceOrderService = new MarketplaceOrderService();

module.exports = defaultMarketplaceOrderService;
module.exports.MarketplaceOrderService = MarketplaceOrderService;
