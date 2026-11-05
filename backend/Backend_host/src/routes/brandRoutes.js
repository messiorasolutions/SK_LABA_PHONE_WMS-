const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { validateCreateBrand, validateUpdateBrand } = require('../validations/brandValidation');

// Brand routes
router.post('/', validateCreateBrand, (req, res, next) => brandController.createBrand(req, res, next));
router.get('/', (req, res, next) => brandController.getAllBrands(req, res, next));
router.get('/:id', (req, res, next) => brandController.getBrandById(req, res, next));
router.put('/:id', validateUpdateBrand, (req, res, next) => brandController.updateBrand(req, res, next));
router.delete('/:id', (req, res, next) => brandController.deleteBrand(req, res, next));

module.exports = router;
