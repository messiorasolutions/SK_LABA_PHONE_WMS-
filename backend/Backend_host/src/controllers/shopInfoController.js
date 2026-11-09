const shopInfoService = require('../services/shopInfoService');

class ShopInfoController {
    async getShopInfo(req, res, next) {
        try {
            const data = await shopInfoService.getShopInfo();
            return res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    async updateShopInfo(req, res, next) {
        try {
            const updated = await shopInfoService.updateShopInfo(req.body);
            return res.status(200).json({
                success: true,
                message: 'Shop information updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ShopInfoController();

