const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const {
    validateCreateOffer,
    validateUpdateOffer
} = require('../validations/offerValidation');

// Active offers for storefront (MUST be before /:id)
router.get('/active', (req, res, next) => offerController.getActiveOffers(req, res, next));

// Manager offers management routes
router.post('/', validateCreateOffer, (req, res, next) => offerController.createOffer(req, res, next));
router.get('/', (req, res, next) => offerController.getAllOffers(req, res, next));
router.get('/:id', (req, res, next) => offerController.getOfferById(req, res, next));
router.put('/:id', validateUpdateOffer, (req, res, next) => offerController.updateOffer(req, res, next));
router.delete('/:id', (req, res, next) => offerController.deleteOffer(req, res, next));

module.exports = router;

