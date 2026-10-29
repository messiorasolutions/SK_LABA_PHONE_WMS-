const offerRepository = require('../repositories/offerRepository');
const phoneRepository = require('../repositories/phoneRepository');
const AppError = require('../utils/customError');

class OfferService {
    /**
     * Helper to populate basic phone details for an offer
     */
    async _populatePhones(offer) {
        if (!offer || !Array.isArray(offer.phone_ids) || offer.phone_ids.length === 0) {
            return { ...offer, phones: [] };
        }

        const phonePromises = offer.phone_ids.map(pid => phoneRepository.findById(pid));
        const resolved = await Promise.all(phonePromises);
        const phones = resolved.filter(Boolean).map(p => ({
            phone_id: p.phone_id,
            name: p.name,
            brand_id: p.brand_id,
            brand_name: p.brand_name,
            price: Number(p.price),
            availability: p.availability,
            photos: p.photos
        }));

        return { ...offer, phones };
    }

    /**
     * Create a new promotional offer (MG-03)
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async createOffer(data) {
        const cleanTitle = data.title.trim();
        const regularPrice = Number(data.regular_price);
        const offerPrice = Number(data.offer_price);

        // Verify that included phone IDs actually exist
        const phoneIds = (data.phone_ids || []).map(Number);
        for (const pid of phoneIds) {
            const phone = await phoneRepository.findById(pid);
            if (!phone) {
                throw new AppError(`Phone with ID ${pid} does not exist.`, 404);
            }
        }

        const offerData = {
            title: cleanTitle,
            description: data.description ? data.description.trim() : null,
            banner_image: data.banner_image ? data.banner_image.trim() : null,
            phone_ids: phoneIds,
            regular_price: regularPrice,
            offer_price: offerPrice,
            start_date_time: new Date(data.start_date_time),
            end_date_time: new Date(data.end_date_time),
            status: data.status ? data.status.trim().toUpperCase() : 'DRAFT'
        };

        const newOffer = await offerRepository.create(offerData);
        return await this._populatePhones(newOffer);
    }

    /**
     * Retrieve all offers with optional filters (MG-03 & AL-04)
     * @param {Object} [filters]
     * @returns {Promise<Array>}
     */
    async getAllOffers(filters = {}) {
        const offers = await offerRepository.findAll(filters);
        const populated = await Promise.all(offers.map(o => this._populatePhones(o)));
        return populated;
    }

    /**
     * Retrieve only currently active offers (C-01 & C-12)
     * @returns {Promise<Array>}
     */
    async getActiveOffers() {
        const activeOffers = await offerRepository.findActiveOffers();
        const populated = await Promise.all(activeOffers.map(o => this._populatePhones(o)));
        return populated;
    }

    /**
     * Retrieve a single offer by ID
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async getOfferById(id) {
        const offer = await offerRepository.findById(id);
        if (!offer) {
            throw new AppError(`Offer with ID ${id} not found.`, 404);
        }
        return await this._populatePhones(offer);
    }

    /**
     * Update an existing offer (MG-03)
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async updateOffer(id, data) {
        const existing = await offerRepository.findById(id);
        if (!existing) {
            throw new AppError(`Offer with ID ${id} not found.`, 404);
        }

        let phoneIds = existing.phone_ids;
        if (data.phone_ids !== undefined) {
            phoneIds = (data.phone_ids || []).map(Number);
            for (const pid of phoneIds) {
                const phone = await phoneRepository.findById(pid);
                if (!phone) {
                    throw new AppError(`Phone with ID ${pid} does not exist.`, 404);
                }
            }
        }

        const regularPrice = data.regular_price !== undefined ? Number(data.regular_price) : existing.regular_price;
        const offerPrice = data.offer_price !== undefined ? Number(data.offer_price) : existing.offer_price;

        if (offerPrice >= regularPrice) {
            throw new AppError('offer_price must be less than regular_price.', 400);
        }

        const startDateTime = data.start_date_time !== undefined ? new Date(data.start_date_time) : existing.start_date_time;
        const endDateTime = data.end_date_time !== undefined ? new Date(data.end_date_time) : existing.end_date_time;

        if (new Date(endDateTime) <= new Date(startDateTime)) {
            throw new AppError('end_date_time must be later than start_date_time.', 400);
        }

        const merged = {
            title: data.title !== undefined ? data.title.trim() : existing.title,
            description: data.description !== undefined ? (data.description ? data.description.trim() : null) : existing.description,
            banner_image: data.banner_image !== undefined ? (data.banner_image ? data.banner_image.trim() : null) : existing.banner_image,
            phone_ids: phoneIds,
            regular_price: regularPrice,
            offer_price: offerPrice,
            start_date_time: startDateTime,
            end_date_time: endDateTime,
            status: data.status !== undefined ? data.status.trim().toUpperCase() : existing.status
        };

        const updated = await offerRepository.update(id, merged);
        return await this._populatePhones(updated);
    }

    /**
     * Delete an offer by ID (MG-03)
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async deleteOffer(id) {
        const existing = await offerRepository.findById(id);
        if (!existing) {
            throw new AppError(`Offer with ID ${id} not found.`, 404);
        }

        await offerRepository.delete(id);
        return {
            offer_id: Number(id),
            title: existing.title
        };
    }

    /**
     * Check if a specific phone has an active offer running (C-02 & C-03)
     * @param {number|string} phone_id
     * @returns {Promise<Object>}
     */
    async getPhoneOffer(phone_id) {
        const phone = await phoneRepository.findById(phone_id);
        if (!phone) {
            throw new AppError(`Phone with ID ${phone_id} not found.`, 404);
        }

        const activeOffer = await offerRepository.findActiveOfferByPhoneId(phone_id);

        if (!activeOffer) {
            return {
                phone_id: Number(phone_id),
                phone_name: phone.name,
                regular_price: Number(phone.price),
                has_active_offer: false,
                offer: null
            };
        }

        return {
            phone_id: Number(phone_id),
            phone_name: phone.name,
            regular_price: Number(phone.price),
            has_active_offer: true,
            offer: {
                offer_id: activeOffer.offer_id,
                title: activeOffer.title,
                banner_image: activeOffer.banner_image,
                offer_price: activeOffer.offer_price,
                savings: activeOffer.discount_amount,
                discount_percentage: activeOffer.discount_percentage,
                start_date_time: activeOffer.start_date_time,
                end_date_time: activeOffer.end_date_time,
                seconds_remaining: activeOffer.seconds_remaining
            }
        };
    }
}

module.exports = new OfferService();

