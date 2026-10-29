const offerService = require('../services/offerService');

class OfferController {
    /**
     * POST /api/offers
     * Create a new offer
     */
    async createOffer(req, res, next) {
        try {
            const offer = await offerService.createOffer(req.body || {});
            return res.status(201).json({
                success: true,
                message: 'Offer created successfully',
                data: offer
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/offers
     * Retrieve all offers with optional filters (?stage=active|upcoming|ended|draft, ?search=...)
     */
    async getAllOffers(req, res, next) {
        try {
            const { stage, status, search } = req.query;
            const offers = await offerService.getAllOffers({ stage, status, search });
            return res.status(200).json({
                success: true,
                count: offers.length,
                data: offers
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/offers/active
     * Retrieve currently active offers for storefront (C-01, C-12)
     */
    async getActiveOffers(req, res, next) {
        try {
            const activeOffers = await offerService.getActiveOffers();
            return res.status(200).json({
                success: true,
                count: activeOffers.length,
                data: activeOffers
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/offers/:id
     * Retrieve single offer by ID
     */
    async getOfferById(req, res, next) {
        try {
            const { id } = req.params;
            const offer = await offerService.getOfferById(id);
            return res.status(200).json({
                success: true,
                data: offer
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/offers/:id
     * Update an existing offer
     */
    async updateOffer(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await offerService.updateOffer(id, req.body || {});
            return res.status(200).json({
                success: true,
                message: 'Offer updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/offers/:id
     * Delete an offer
     */
    async deleteOffer(req, res, next) {
        try {
            const { id } = req.params;
            const result = await offerService.deleteOffer(id);
            return res.status(200).json({
                success: true,
                message: `Offer '${result.title}' deleted successfully`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/phones/:id/offer
     * Check active offer for a phone (C-02, C-03)
     */
    async getPhoneOffer(req, res, next) {
        try {
            const { id } = req.params;
            const result = await offerService.getPhoneOffer(id);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OfferController();

