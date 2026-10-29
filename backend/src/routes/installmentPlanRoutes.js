const express = require('express');
const router = express.Router();
const installmentPlanController = require('../controllers/installmentPlanController');
const {
    validateCreatePlan,
    validateUpdatePlan
} = require('../validations/installmentPlanValidation');

// Routes for Installment Plans Management (MG-11)
router.post('/', validateCreatePlan, (req, res, next) => installmentPlanController.createPlan(req, res, next));
router.get('/', (req, res, next) => installmentPlanController.getAllPlans(req, res, next));
router.get('/:id', (req, res, next) => installmentPlanController.getPlanById(req, res, next));
router.put('/:id', validateUpdatePlan, (req, res, next) => installmentPlanController.updatePlan(req, res, next));

router.patch('/:id/toggle-status', (req, res, next) => installmentPlanController.toggleStatus(req, res, next));
router.post('/:id/toggle-status', (req, res, next) => installmentPlanController.toggleStatus(req, res, next));

router.delete('/:id', (req, res, next) => installmentPlanController.deletePlan(req, res, next));

module.exports = router;

