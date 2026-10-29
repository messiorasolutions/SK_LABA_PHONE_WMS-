const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');
const installmentPlanController = require('../controllers/installmentPlanController');
const offerController = require('../controllers/offerController');
const {
    validateCreatePhone,
    validateUpdatePhone
} = require('../validations/phoneValidation');

// Stock Management Routes (MUST be defined before /:id)
router.get('/stock', (req, res, next) => phoneController.getStockList(req, res, next));
router.post('/:id/stock/add', (req, res, next) => phoneController.addStock(req, res, next));
router.post('/:id/stock/remove', (req, res, next) => phoneController.removeStock(req, res, next));

router.patch('/:id/stock/sold-out', (req, res, next) => phoneController.markSoldOut(req, res, next));
router.post('/:id/stock/sold-out', (req, res, next) => phoneController.markSoldOut(req, res, next));
router.put('/:id/stock/sold-out', (req, res, next) => phoneController.markSoldOut(req, res, next));

// Archive routes (MUST be defined before /:id)
router.get('/archived', (req, res, next) => phoneController.getArchivedPhones(req, res, next));

router.patch('/:id/archive', (req, res, next) => phoneController.archivePhone(req, res, next));
router.post('/:id/archive', (req, res, next) => phoneController.archivePhone(req, res, next));
router.put('/:id/archive', (req, res, next) => phoneController.archivePhone(req, res, next));

router.patch('/:id/restore', (req, res, next) => phoneController.restorePhone(req, res, next));
router.post('/:id/restore', (req, res, next) => phoneController.restorePhone(req, res, next));
router.put('/:id/restore', (req, res, next) => phoneController.restorePhone(req, res, next));

// Phone Comparison Route (SRS C-05 - Customer/Visitor side-by-side comparison)
router.get('/compare', (req, res, next) => phoneController.comparePhones(req, res, next));

// Phone Favorites Route (SRS C-06 - Customer/Visitor saved items)
router.get('/favorites', (req, res, next) => phoneController.getFavorites(req, res, next));

// Phone Installments Calculation (C-03)
router.get('/:id/installments', (req, res, next) => installmentPlanController.getPhoneInstallments(req, res, next));

// Phone Offer Check (C-02 & C-03)
router.get('/:id/offer', (req, res, next) => offerController.getPhoneOffer(req, res, next));

// Standard Phone routes
router.post('/', validateCreatePhone, (req, res, next) => phoneController.createPhone(req, res, next));
router.get('/', (req, res, next) => phoneController.getAllPhones(req, res, next));
router.get('/:id', (req, res, next) => phoneController.getPhoneById(req, res, next));
router.put('/:id', validateUpdatePhone, (req, res, next) => phoneController.updatePhone(req, res, next));
router.delete('/:id', (req, res, next) => phoneController.deletePhone(req, res, next));

module.exports = router;
