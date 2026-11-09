const express = require('express');
const router = express.Router();
const shopInfoController = require('../controllers/shopInfoController');
const authMiddleware = require('../middleware/authMiddleware');

// Public: GET shop information for storefront and admin dashboard
router.get('/', (req, res, next) => shopInfoController.getShopInfo(req, res, next));

// Protected (Admin only): Update shop information
router.put('/', authMiddleware.authenticate, authMiddleware.requireAdmin, (req, res, next) => {
    shopInfoController.updateShopInfo(req, res, next);
});

module.exports = router;

