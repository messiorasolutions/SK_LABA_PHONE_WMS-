const express = require('express');
const router = express.Router();
const specificationController = require('../controllers/specificationController');
const {
    validateCreateSpecification,
    validateUpdateSpecification
} = require('../validations/specificationValidation');

// Specification routes
router.post('/', validateCreateSpecification, (req, res, next) => specificationController.createSpecification(req, res, next));
router.get('/', (req, res, next) => specificationController.getAllSpecifications(req, res, next));
router.get('/:id', (req, res, next) => specificationController.getSpecificationById(req, res, next));
router.put('/:id', validateUpdateSpecification, (req, res, next) => specificationController.updateSpecification(req, res, next));
router.delete('/:id', (req, res, next) => specificationController.deleteSpecification(req, res, next));

module.exports = router;
