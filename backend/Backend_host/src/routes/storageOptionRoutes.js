const express = require('express');
const router = express.Router();
const storageOptionController = require('../controllers/storageOptionController');
const {
    validateCreateStorageOption,
    validateUpdateStorageOption
} = require('../validations/storageOptionValidation');

// Storage Option routes
router.post('/', validateCreateStorageOption, (req, res, next) => storageOptionController.createStorageOption(req, res, next));
router.get('/', (req, res, next) => storageOptionController.getAllStorageOptions(req, res, next));
router.get('/:id', (req, res, next) => storageOptionController.getStorageOptionById(req, res, next));
router.put('/:id', validateUpdateStorageOption, (req, res, next) => storageOptionController.updateStorageOption(req, res, next));
router.delete('/:id', (req, res, next) => storageOptionController.deleteStorageOption(req, res, next));

module.exports = router;
