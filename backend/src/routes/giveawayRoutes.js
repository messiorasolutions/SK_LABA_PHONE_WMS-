const express = require('express');
const router = express.Router();
const giveawayController = require('../controllers/giveawayController');
const {
    validateCreateGiveaway,
    validateUpdateGiveaway,
    validatePublishWinners
} = require('../validations/giveawayValidation');

// Dashboard metrics overview (Must be defined before /:id)
router.get('/overview', (req, res, next) => giveawayController.getDashboardOverview(req, res, next));

// List and single lookup (Public storefront + Admin)
router.get('/', (req, res, next) => giveawayController.getAllGiveaways(req, res, next));
router.get('/:id', (req, res, next) => giveawayController.getGiveawayById(req, res, next));

// Admin Management
router.post('/', validateCreateGiveaway, (req, res, next) => giveawayController.createGiveaway(req, res, next));
router.put('/:id', validateUpdateGiveaway, (req, res, next) => giveawayController.updateGiveaway(req, res, next));
router.delete('/:id', (req, res, next) => giveawayController.deleteGiveaway(req, res, next));

// Extended Actions
router.patch('/:id/extend', (req, res, next) => giveawayController.extendEndDate(req, res, next));
router.patch('/:id/close', (req, res, next) => giveawayController.manuallyClose(req, res, next));
router.post('/:id/winners', validatePublishWinners, (req, res, next) => giveawayController.publishWinners(req, res, next));

module.exports = router;

