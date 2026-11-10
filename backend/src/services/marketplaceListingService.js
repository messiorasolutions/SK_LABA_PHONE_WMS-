/**
 * MarketplaceListingService
 * Core business logic for Phone Marketplace listings, review workflow,
 * server-side catalogue normalization, and automated seller notifications.
 */

const defaultListingRepo = require('../repositories/marketplaceListingRepository');
const defaultBrandRepo = require('../repositories/brandRepository');
const defaultStorageRepo = require('../repositories/storageOptionRepository');
const defaultPhoneRepo = require('../repositories/phoneRepository');
const defaultCommissionService = require('./marketplaceCommissionService');
const defaultNormalizationService = require('./productNormalizationService');
const defaultTermsService = require('./marketplaceTermsService');
const defaultEmailService = require('./emailService');
const defaultAuditService = require('./marketplaceAuditService');
const defaultPool = require('../config/db');
const AppError = require('../utils/customError');

const SHOP_WHATSAPP_NUMBER = '821058927482'; // SK LABA PHONE official WhatsApp

class MarketplaceListingService {
    constructor({
        listingRepository = defaultListingRepo,
        brandRepository = defaultBrandRepo,
        storageRepository = defaultStorageRepo,
        phoneRepository = defaultPhoneRepo,
        commissionService = defaultCommissionService,
        normalizationService = defaultNormalizationService,
        termsService = defaultTermsService,
        emailService = defaultEmailService,
        auditService = defaultAuditService,
        pool = defaultPool
    } = {}) {
        this.listingRepo = listingRepository;
        this.brandRepo = brandRepository;
        this.storageRepo = storageRepository;
        this.phoneRepo = phoneRepository;
        this.commissionService = commissionService;
        this.normalizationService = normalizationService;
        this.termsService = termsService;
        this.emailService = emailService;
        this.auditService = auditService;
        this.pool = pool;
    }

    /**
     * Public Seller Submission (Sell Your Phone)
     * No dashboard login required.
     */
    async submitListing(data, { ipAddress = null, authenticatedUserId = null } = {}) {
        // 1. Validate required seller contact
        if (!data.seller_name || typeof data.seller_name !== 'string' || data.seller_name.trim().length === 0) {
            throw new AppError('Seller name is required.', 400);
        }
        if (!data.seller_email || typeof data.seller_email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.seller_email.trim())) {
            throw new AppError('A valid seller email address is required.', 400);
        }
        if (!data.seller_phone || typeof data.seller_phone !== 'string' || data.seller_phone.trim().length < 7) {
            throw new AppError('A valid seller contact phone number is required.', 400);
        }

        // 2. Validate phone specs
        if (!data.brand || typeof data.brand !== 'string' || data.brand.trim().length === 0) {
            throw new AppError('Phone brand is required.', 400);
        }
        if (!data.model || typeof data.model !== 'string' || data.model.trim().length === 0) {
            throw new AppError('Phone model is required.', 400);
        }
        if (!data.storage || typeof data.storage !== 'string' || data.storage.trim().length === 0) {
            throw new AppError('Storage capacity is required.', 400);
        }
        if (!data.color || typeof data.color !== 'string' || data.color.trim().length === 0) {
            throw new AppError('Color is required.', 400);
        }
        if (!data.condition_description || typeof data.condition_description !== 'string' || data.condition_description.trim().length === 0) {
            throw new AppError('Condition description is required.', 400);
        }

        // 3. Price validation
        const normalizedPrice = this.normalizationService.normalizePrice(data.price);
        if (normalizedPrice <= 0) {
            throw new AppError('A valid selling price greater than zero is required.', 400);
        }

        // 4. Photos validation
        const photos = Array.isArray(data.photos) ? data.photos : [];
        if (photos.length === 0) {
            throw new AppError('At least one genuine photo of the device is required.', 400);
        }

        // 5. Seller Terms acceptance
        if (data.seller_terms_accepted !== true && data.seller_terms_accepted !== 'true' && data.seller_terms_accepted !== 1) {
            throw new AppError('You must accept the Marketplace Seller Terms & Conditions.', 400);
        }

        const activeTerms = await this.termsService.getActiveTerms('SELLER');
        const conditionGrade = this.normalizationService.normalizeConditionGrade(data.condition_grade || data.condition);

        // Match brand
        const brands = await this.brandRepo.findAllActive ? await this.brandRepo.findAllActive() : [];
        const normalizedBrand = this.normalizationService.normalizeBrand(data.brand, brands);

        const listingRecord = await this.listingRepo.create({
            seller_id: authenticatedUserId || null,
            seller_name: data.seller_name.trim(),
            seller_email: data.seller_email.trim().toLowerCase(),
            seller_phone: data.seller_phone.trim(),
            brand_id: normalizedBrand.brand_id,
            brand: normalizedBrand.brand_name,
            model: this.normalizationService.normalizeModel(data.model, normalizedBrand.brand_name),
            storage: data.storage.trim().toUpperCase(),
            color: data.color.trim(),
            condition_grade: conditionGrade,
            condition_description: data.condition_description.trim(),
            physical_condition: data.physical_condition ? String(data.physical_condition).trim() : null,
            display_condition: data.display_condition ? String(data.display_condition).trim() : null,
            camera_condition: data.camera_condition ? String(data.camera_condition).trim() : null,
            biometrics_status: data.biometrics_status ? String(data.biometrics_status).trim() : null,
            battery_health: data.battery_health !== undefined && data.battery_health !== null && !isNaN(Number(data.battery_health))
                ? Math.min(100, Math.max(0, parseInt(data.battery_health, 10)))
                : null,
            price: normalizedPrice,
            description: data.description ? String(data.description).trim() : null,
            accessories_included: Array.isArray(data.accessories_included) ? data.accessories_included : null,
            original_box: Boolean(data.original_box === true || data.original_box === 'true' || data.original_box === 1),
            charger_included: Boolean(data.charger_included === true || data.charger_included === 'true' || data.charger_included === 1),
            warranty_info: data.warranty_info ? String(data.warranty_info).trim() : null,
            photos,
            status: 'PENDING_REVIEW',
            seller_terms_version: activeTerms.version || '1.0'
        });

        // Audit log
        await this.auditService.log({
            entityType: 'LISTING',
            entityId: listingRecord.listing_id,
            action: 'LISTING_SUBMITTED',
            actorUserId: authenticatedUserId || null,
            actorRole: 'SELLER',
            details: {
                brand: listingRecord.brand,
                model: listingRecord.model,
                price: listingRecord.price,
                seller_email: listingRecord.seller_email
            },
            ipAddress
        });

        return {
            listing_id: listingRecord.listing_id,
            listing_ref: listingRecord.listing_ref,
            brand: listingRecord.brand,
            model: listingRecord.model,
            status: listingRecord.status,
            message: 'Your phone has been submitted for Marketplace review. You will receive an email once reviewed.'
        };
    }

    /**
     * Retrieve complete details by ID (Admin / Authenticated view)
     */
    async getListingById(listingId) {
        const listing = await this.listingRepo.findById(listingId);
        if (!listing) {
            throw new AppError('Marketplace listing not found.', 404);
        }
        return listing;
    }

    /**
     * Admin Listing List with filters, search, and pagination
     */
    async listAllListings(filters = {}) {
        return await this.listingRepo.findListings(filters);
    }

    /**
     * Public Marketplace browsing (STRICTLY PUBLISHED ONLY)
     * Formats to the canonical Smartphone card structure.
     */
    async getPublishedListings(filters = {}) {
        const publishedFilters = {
            ...filters,
            status: 'PUBLISHED' // Strictly enforce PUBLISHED
        };

        const result = await this.listingRepo.findListings(publishedFilters);

        // Map each listing to canonical Smartphone card data format
        const phoneCards = result.data.map((listing) => {
            const mainPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null;
            const waText = encodeURIComponent(`Hi SK LABA PHONE, I am interested in Marketplace listing ${listing.listing_ref}: ${listing.brand} ${listing.model} (Rs. ${listing.price.toLocaleString('en-US')})`);
            const waUrl = `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${waText}`;

            return {
                id: listing.listing_id,
                listing_id: listing.listing_id,
                listing_ref: listing.listing_ref,
                name: `${listing.brand} ${listing.model}`,
                brand: listing.brand,
                model: listing.model,
                storage: listing.storage,
                color: listing.color,
                price: Number(listing.price),
                regular_price: Number(listing.price),
                effective_price: Number(listing.price),
                main_photo: mainPhoto,
                primaryImage: mainPhoto,
                image_url: mainPhoto,
                photos: listing.photos || (mainPhoto ? [mainPhoto] : []),
                availability: 'IN_STOCK',
                availability_label: 'Available in Marketplace',
                condition: 'USED',
                phone_condition: 'USED',
                condition_grade: listing.condition_grade,
                condition_description: listing.condition_description,
                description: listing.condition_description || listing.description,
                physical_condition: listing.physical_condition,
                display_condition: listing.display_condition,
                camera_condition: listing.camera_condition,
                biometrics_status: listing.biometrics_status,
                battery_health: listing.battery_health,
                accessories_included: listing.accessories_included,
                original_box: listing.original_box,
                charger_included: listing.charger_included,
                warranty_info: listing.warranty_info,
                source: 'MARKETPLACE',
                product_source: 'MARKETPLACE',
                ownership_type: 'SELLER_OWNED',
                whatsapp_contact_url: waUrl
            };
        });

        return {
            data: phoneCards,
            pagination: result.pagination
        };
    }

    /**
     * Public detail view for a published marketplace listing
     */
    async getPublishedListingById(listingId) {
        const listing = await this.listingRepo.findById(listingId);
        if (!listing || listing.status !== 'PUBLISHED') {
            throw new AppError('Marketplace phone is not available.', 404);
        }

        const mainPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null;
        const waText = encodeURIComponent(`Hi SK LABA PHONE, I am interested in Marketplace listing ${listing.listing_ref}: ${listing.brand} ${listing.model} (Rs. ${listing.price.toLocaleString('en-US')})`);

        return {
            id: listing.listing_id,
            listing_ref: listing.listing_ref,
            name: `${listing.brand} ${listing.model}`,
            brand: listing.brand,
            model: listing.model,
            storage: listing.storage,
            color: listing.color,
            price: listing.price,
            regular_price: listing.price,
            effective_price: listing.price,
            main_photo: mainPhoto,
            primaryImage: mainPhoto,
            photos: listing.photos || [],
            additionalImages: listing.photos && listing.photos.length > 1 ? listing.photos.slice(1) : [],
            availability: 'IN_STOCK',
            condition: 'USED',
            phone_condition: 'USED',
            condition_grade: listing.condition_grade,
            condition_description: listing.condition_description,
            physical_condition: listing.physical_condition,
            display_condition: listing.display_condition,
            camera_condition: listing.camera_condition,
            biometrics_status: listing.biometrics_status,
            battery_health: listing.battery_health,
            accessories_included: listing.accessories_included,
            original_box: listing.original_box,
            charger_included: listing.charger_included,
            warranty_info: listing.warranty_info,
            description: listing.condition_description || listing.description,
            source: 'MARKETPLACE',
            product_source: 'MARKETPLACE',
            ownership_type: 'SELLER_OWNED',
            whatsapp_contact_url: `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${waText}`
        };
    }

    /**
     * Move to UNDER_REVIEW
     */
    async setUnderReview(listingId, adminUserId) {
        const listing = await this.getListingById(listingId);
        if (listing.status !== 'PENDING_REVIEW' && listing.status !== 'CHANGES_REQUESTED') {
            throw new AppError(`Cannot move listing in status '${listing.status}' to UNDER_REVIEW.`, 400);
        }

        const updated = await this.listingRepo.updateStatus(listingId, {
            status: 'UNDER_REVIEW',
            reviewed_by: adminUserId,
            reviewed_at: new Date()
        });

        await this.auditService.log({
            entityType: 'LISTING',
            entityId: listingId,
            action: 'LISTING_UNDER_REVIEW',
            actorUserId: adminUserId,
            actorRole: 'ADMIN'
        });

        return updated;
    }

    /**
     * Admin Review: APPROVE listing and publish to Smartphones catalogue.
     * Triggers automated Seller Approval Email with server-side commission & expected payout.
     */
    async approveListing(listingId, adminUserId, { admin_notes = null, autoPublish = true } = {}) {
        const listing = await this.getListingById(listingId);
        if (listing.status !== 'PENDING_REVIEW' && listing.status !== 'UNDER_REVIEW') {
            throw new AppError(`Cannot approve listing in status '${listing.status}'. Must be PENDING_REVIEW or UNDER_REVIEW.`, 400);
        }

        const photos = Array.isArray(listing.photos) ? listing.photos : [];
        if (photos.length === 0) {
            throw new AppError('Marketplace listing must have at least one valid photo with a primary image before it can be approved and published.', 400);
        }

        // 1. Calculate financials snapshot
        const financials = await this.commissionService.calculateFinancials(listing.price);

        const connection = await this.pool.getConnection();
        let updatedListing;

        try {
            await connection.beginTransaction();

            const targetStatus = autoPublish ? 'PUBLISHED' : 'APPROVED';
            const now = new Date();

            // 2. Update listing status
            updatedListing = await this.listingRepo.updateStatus(listingId, {
                status: targetStatus,
                admin_notes,
                approved_by: adminUserId,
                approved_at: now,
                published_at: autoPublish ? now : null
            }, connection);

            // 3. Marketplace listings remain exclusively in marketplace_listings table
            // and do NOT pollute the standard smartphone catalogue.
            // Sellers phones are only added to Marketplace, not Smartphone section.

            // 4. Audit Log
            await this.auditService.log({
                entityType: 'LISTING',
                entityId: listingId,
                action: autoPublish ? 'LISTING_PUBLISHED' : 'LISTING_APPROVED',
                actorUserId: adminUserId,
                actorRole: 'ADMIN',
                details: {
                    status: targetStatus,
                    price: listing.price,
                    commission_rate: financials.commission_rate,
                    commission_amount: financials.commission_amount,
                    expected_payout: financials.seller_payout
                }
            }, connection);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        // 5. Automated Seller Approval Email (Out-of-transaction, failure does NOT rollback approval)
        try {
            const sellerEmail = (listing.seller_email || '').trim().toLowerCase();
            if (!sellerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
                console.warn(`[MarketplaceListingService] Listing ${listingId} (${listing.listing_ref}) has invalid seller email: "${listing.seller_email}". Approval email skipped.`);
            } else {
                const emailSent = await this.emailService.sendMarketplaceSellerApprovalEmail({
                    to: sellerEmail,
                    sellerName: listing.seller_name,
                    phoneBrand: listing.brand,
                    phoneModel: listing.model,
                    storage: listing.storage,
                    listingRef: listing.listing_ref,
                    listedPrice: financials.selling_price,
                    commissionRate: financials.commission_rate,
                    commissionAmount: financials.commission_amount,
                    expectedPayout: financials.seller_payout
                });

                if (!emailSent) {
                    console.error('[MarketplaceListingService] Marketplace approval email failed', {
                        listingId,
                        listingRef: listing.listing_ref,
                        emailType: 'SELLER_APPROVAL',
                        sellerEmail
                    });
                } else {
                    console.log(`[MarketplaceListingService] Automated approval email sent to ${sellerEmail} for listing ${listing.listing_ref}`);
                }
            }
        } catch (emailErr) {
            console.error('[MarketplaceListingService] Automated approval email delivery error:', {
                listingId,
                listingRef: listing.listing_ref,
                emailType: 'SELLER_APPROVAL',
                error: emailErr.message
            });
        }

        return {
            ...updatedListing,
            financials
        };
    }

    /**
     * Admin Review: REJECT listing
     * Rejection reason is strictly required. Triggers automated Seller Rejection Email.
     */
    async rejectListing(listingId, adminUserId, { rejection_reason, admin_notes = null }) {
        if (!rejection_reason || typeof rejection_reason !== 'string' || rejection_reason.trim().length === 0) {
            throw new AppError('A valid rejection reason is required to reject a marketplace listing.', 400);
        }

        const listing = await this.getListingById(listingId);
        const connection = await this.pool.getConnection();
        let updatedListing;

        try {
            await connection.beginTransaction();

            updatedListing = await this.listingRepo.updateStatus(listingId, {
                status: 'REJECTED',
                rejection_reason: rejection_reason.trim(),
                admin_notes,
                reviewed_by: adminUserId,
                reviewed_at: new Date()
            }, connection);

            // Remove/archive from smartphones catalogue if previously linked
            await connection.query(
                `UPDATE phones SET status = 'ARCHIVED', availability = 'SOLD_OUT' WHERE marketplace_listing_id = ?`,
                [Number(listingId)]
            );

            await this.auditService.log({
                entityType: 'LISTING',
                entityId: listingId,
                action: 'LISTING_REJECTED',
                actorUserId: adminUserId,
                actorRole: 'ADMIN',
                details: { rejection_reason: rejection_reason.trim() }
            }, connection);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        // Automated Rejection Email (Failure does not rollback)
        try {
            await this.emailService.sendMarketplaceSellerRejectionEmail({
                to: listing.seller_email,
                sellerName: listing.seller_name,
                phoneBrand: listing.brand,
                phoneModel: listing.model,
                listingRef: listing.listing_ref,
                rejectionReason: rejection_reason.trim()
            });
        } catch (emailErr) {
            console.error('[MarketplaceListingService] Automated rejection email delivery error:', emailErr.message);
        }

        return updatedListing;
    }

    /**
     * Admin Review: REQUEST CHANGES
     * Changes requested reason is required. Triggers automated email notification.
     */
    async requestChanges(listingId, adminUserId, { changes_requested_reason, admin_notes = null }) {
        if (!changes_requested_reason || typeof changes_requested_reason !== 'string' || changes_requested_reason.trim().length === 0) {
            throw new AppError('Please provide clear instructions on what changes are required.', 400);
        }

        const listing = await this.getListingById(listingId);
        const updatedListing = await this.listingRepo.updateStatus(listingId, {
            status: 'CHANGES_REQUESTED',
            changes_requested_reason: changes_requested_reason.trim(),
            admin_notes,
            reviewed_by: adminUserId,
            reviewed_at: new Date()
        });

        await this.auditService.log({
            entityType: 'LISTING',
            entityId: listingId,
            action: 'CHANGES_REQUESTED',
            actorUserId: adminUserId,
            actorRole: 'ADMIN',
            details: { changes_requested_reason: changes_requested_reason.trim() }
        });

        // Automated Changes Requested Email (Failure does not rollback)
        try {
            await this.emailService.sendMarketplaceChangesRequestedEmail({
                to: listing.seller_email,
                sellerName: listing.seller_name,
                phoneBrand: listing.brand,
                phoneModel: listing.model,
                listingRef: listing.listing_ref,
                changesRequestedReason: changes_requested_reason.trim()
            });
        } catch (emailErr) {
            console.error('[MarketplaceListingService] Automated changes requested email delivery error:', emailErr.message);
        }

        return updatedListing;
    }

    /**
     * Admin Action: UNPUBLISH listing
     */
    async unpublishListing(listingId, adminUserId, { admin_notes = null } = {}) {
        const listing = await this.getListingById(listingId);
        if (listing.status !== 'PUBLISHED') {
            throw new AppError(`Listing is in status '${listing.status}', only PUBLISHED listings can be unpublished.`, 400);
        }

        const connection = await this.pool.getConnection();
        let updatedListing;

        try {
            await connection.beginTransaction();

            updatedListing = await this.listingRepo.updateStatus(listingId, {
                status: 'UNPUBLISHED',
                admin_notes
            }, connection);

            // Hide from Smartphone catalogue
            await connection.query(
                `UPDATE phones SET status = 'DRAFT', availability = 'SOLD_OUT' WHERE marketplace_listing_id = ?`,
                [Number(listingId)]
            );

            await this.auditService.log({
                entityType: 'LISTING',
                entityId: listingId,
                action: 'LISTING_UNPUBLISHED',
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

        return updatedListing;
    }

    /**
     * Admin Action: MARK AS SOLD & REMOVE FROM MARKETPLACE
     * Transitions listing to 'SOLD', archives linked phone from catalogue.
     */
    async markListingSold(listingId, adminUserId, { sold_price = null, admin_notes = null } = {}) {
        const listing = await this.getListingById(listingId);
        const connection = await this.pool.getConnection();
        let updatedListing;

        try {
            await connection.beginTransaction();

            const updateData = {
                status: 'SOLD',
                admin_notes: admin_notes || listing.admin_notes
            };

            updatedListing = await this.listingRepo.updateStatus(listingId, updateData, connection);

            // Archive from phones catalogue so it is immediately removed from marketplace/smartphones
            await connection.query(
                `UPDATE phones SET status = 'ARCHIVED', availability = 'SOLD_OUT' WHERE marketplace_listing_id = ?`,
                [Number(listingId)]
            );

            await this.auditService.log({
                entityType: 'LISTING',
                entityId: listingId,
                action: 'LISTING_MARKED_SOLD',
                actorUserId: adminUserId,
                actorRole: 'ADMIN',
                metadata: { sold_price, admin_notes }
            }, connection);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return updatedListing;
    }

    /**
     * Admin Action: REMOVE / CANCEL LISTING
     * Archives listing and removes from catalogue.
     */
    async deleteListing(listingId, adminUserId, { reason = null } = {}) {
        const listing = await this.getListingById(listingId);
        const connection = await this.pool.getConnection();
        let updatedListing;

        try {
            await connection.beginTransaction();

            updatedListing = await this.listingRepo.updateStatus(listingId, {
                status: 'CANCELLED',
                admin_notes: reason ? `Removed: ${reason}` : 'Removed by administrator'
            }, connection);

            // Archive/remove from phones catalogue
            await connection.query(
                `UPDATE phones SET status = 'ARCHIVED', availability = 'SOLD_OUT' WHERE marketplace_listing_id = ?`,
                [Number(listingId)]
            );

            await this.auditService.log({
                entityType: 'LISTING',
                entityId: listingId,
                action: 'LISTING_DELETED',
                actorUserId: adminUserId,
                actorRole: 'ADMIN',
                metadata: { reason }
            }, connection);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return updatedListing;
    }

    /**
     * Synchronize published Marketplace listing with canonical `phones` table.
     * Prevents duplicates by matching on `marketplace_listing_id`.
     */
    async _syncWithSmartphoneCatalogue(listing, executor) {
        // 1. Fetch existing brands and storage options
        const [brandRows] = await executor.query('SELECT brand_id, brand_name FROM brands');
        const [storageRows] = await executor.query('SELECT storage_id, storage_name FROM storage_options');

        const normalizedBrand = this.normalizationService.normalizeBrand(listing.brand, brandRows);
        const normalizedStorage = this.normalizationService.normalizeStorage(listing.storage, storageRows);

        // Map to Smartphone product record
        const phoneData = this.normalizationService.mapToSmartphoneProduct(listing, normalizedBrand, normalizedStorage);

        // Check if phone already exists for this listing
        const [existing] = await executor.query(
            'SELECT phone_id FROM phones WHERE marketplace_listing_id = ? LIMIT 1',
            [Number(listing.listing_id)]
        );

        if (existing.length > 0) {
            // Update existing phone record
            const phoneId = existing[0].phone_id;
            const updateSql = `
                UPDATE phones
                SET name = ?, brand_id = COALESCE(?, brand_id), price = ?, colour_options = ?,
                    availability = 'IN_STOCK', status = 'PUBLISHED', battery_health = ?,
                    used_condition_grade = ?, photos = ?, description = ?
                WHERE phone_id = ?
            `;
            await executor.query(updateSql, [
                phoneData.name,
                phoneData.brand_id,
                phoneData.price,
                JSON.stringify(phoneData.colour_options),
                phoneData.battery_health,
                phoneData.used_condition_grade,
                JSON.stringify(phoneData.photos),
                phoneData.description,
                phoneId
            ]);
        } else {
            // Insert new phone record
            const insertSql = `
                INSERT INTO phones (
                    name, brand_id, phone_condition, price, storage_ids, colour_options,
                    warranty, description, low_stock_level, current_stock, availability,
                    installment_enabled, status, is_archived, is_new_arrival, product_source,
                    ownership_type, marketplace_listing_id, battery_health, used_condition_grade, photos
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await executor.query(insertSql, [
                phoneData.name,
                phoneData.brand_id || 1, // Fallback to first brand if brand_id null
                phoneData.phone_condition,
                phoneData.price,
                phoneData.storage_ids ? JSON.stringify(phoneData.storage_ids) : null,
                JSON.stringify(phoneData.colour_options),
                phoneData.warranty,
                phoneData.description,
                phoneData.low_stock_level,
                phoneData.current_stock,
                phoneData.availability,
                phoneData.installment_enabled,
                phoneData.status,
                phoneData.is_archived,
                phoneData.is_new_arrival,
                phoneData.product_source,
                phoneData.ownership_type,
                phoneData.marketplace_listing_id,
                phoneData.battery_health,
                phoneData.used_condition_grade,
                JSON.stringify(phoneData.photos)
            ]);
        }
    }
}

const defaultMarketplaceListingService = new MarketplaceListingService();

module.exports = defaultMarketplaceListingService;
module.exports.MarketplaceListingService = MarketplaceListingService;
