const giveawayService = require('../services/giveawayService');

class GiveawayController {
    async getAllGiveaways(req, res, next) {
        try {
            const { status, search } = req.query;
            const giveaways = await giveawayService.getAllGiveaways({ status, search });
            return res.status(200).json({
                success: true,
                count: giveaways.length,
                data: giveaways
            });
        } catch (error) {
            next(error);
        }
    }

    async getDashboardOverview(req, res, next) {
        try {
            const overview = await giveawayService.getDashboardOverview();
            return res.status(200).json({
                success: true,
                data: overview
            });
        } catch (error) {
            next(error);
        }
    }

    async getGiveawayById(req, res, next) {
        try {
            const { id } = req.params;
            const giveaway = await giveawayService.getGiveawayById(id);
            return res.status(200).json({
                success: true,
                data: giveaway
            });
        } catch (error) {
            next(error);
        }
    }

    async createGiveaway(req, res, next) {
        try {
            const created = await giveawayService.createGiveaway(req.body);
            return res.status(201).json({
                success: true,
                message: 'Giveaway created successfully',
                data: created
            });
        } catch (error) {
            next(error);
        }
    }

    async updateGiveaway(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await giveawayService.updateGiveaway(id, req.body);
            return res.status(200).json({
                success: true,
                message: 'Giveaway updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteGiveaway(req, res, next) {
        try {
            const { id } = req.params;
            const result = await giveawayService.deleteGiveaway(id);
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    async extendEndDate(req, res, next) {
        try {
            const { id } = req.params;
            const { end_date } = req.body;
            const updated = await giveawayService.extendEndDate(id, end_date);
            return res.status(200).json({
                success: true,
                message: 'Giveaway end date extended successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    async manuallyClose(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await giveawayService.manuallyClose(id);
            return res.status(200).json({
                success: true,
                message: 'Giveaway has been closed successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    async publishWinners(req, res, next) {
        try {
            const { id } = req.params;
            const { winners } = req.body;
            const result = await giveawayService.publishWinners(id, winners);
            return res.status(200).json({
                success: true,
                message: `Winners announced successfully! Dispatched ${result.emails_sent} winner email(s).`,
                data: result.giveaway,
                emails_sent: result.emails_sent,
                total_winners: result.total_winners
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new GiveawayController();

