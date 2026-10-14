const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');
const {
    validateCreatePhone,
    validateUpdatePhone
} = require('../validations/phoneValidation');

// Phone routes
router.post('/', validateCreatePhone, (req, res, next) => phoneController.createPhone(req, res, next));
router.get('/', (req, res, next) => phoneController.getAllPhones(req, res, next));
router.get('/:id', (req, res, next) => phoneController.getPhoneById(req, res, next));
router.put('/:id', validateUpdatePhone, (req, res, next) => phoneController.updatePhone(req, res, next));
router.delete('/:id', (req, res, next) => phoneController.deletePhone(req, res, next));

module.exports = router;
