const giveawayRepository = require('../repositories/giveawayRepository');
const emailService = require('./emailService');
const AppError = require('../utils/customError');

class GiveawayService {
    constructor({ giveawayRepo = giveawayRepository, mailer = emailService } = {}) {
        this.giveawayRepository = giveawayRepo;
        this.emailService = mailer;
    }

    async getAllGiveaways(filters = {}) {
        return this.giveawayRepository.findAll(filters);
    }

    async getGiveawayById(id) {
        const giveaway = await this.giveawayRepository.findById(id);
        if (!giveaway) {
            throw new AppError(`Giveaway with ID ${id} not found.`, 404);
        }
        return giveaway;
    }

    async getDashboardOverview() {
        return this.giveawayRepository.getDashboardOverview();
    }

    async createGiveaway(data) {
        const payload = {
            title: data.title.trim(),
            short_description: data.short_description ? data.short_description.trim() : null,
            description: data.description ? data.description.trim() : null,
            thumbnail_url: data.thumbnail_url || null,
            start_date: new Date(data.start_date),
            end_date: new Date(data.end_date),
            winner_selection_date: new Date(data.winner_selection_date),
            status: data.status ? String(data.status).trim().toUpperCase() : 'DRAFT',
            is_manually_closed: false,
            winners_announced: false,
            winners: []
        };

        return this.giveawayRepository.create(payload);
    }

    async updateGiveaway(id, data) {
        const existing = await this.getGiveawayById(id);

        const payload = {
            title: data.title !== undefined ? data.title.trim() : existing.title,
            short_description: data.short_description !== undefined ? (data.short_description ? data.short_description.trim() : null) : existing.short_description,
            description: data.description !== undefined ? (data.description ? data.description.trim() : null) : existing.description,
            thumbnail_url: data.thumbnail_url !== undefined ? data.thumbnail_url : existing.thumbnail_url,
            start_date: data.start_date ? new Date(data.start_date) : existing.start_date,
            end_date: data.end_date ? new Date(data.end_date) : existing.end_date,
            winner_selection_date: data.winner_selection_date ? new Date(data.winner_selection_date) : existing.winner_selection_date,
            status: data.status !== undefined ? String(data.status).trim().toUpperCase() : existing.status,
            is_manually_closed: data.is_manually_closed !== undefined ? Boolean(data.is_manually_closed) : existing.is_manually_closed,
            winners_announced: data.winners_announced !== undefined ? Boolean(data.winners_announced) : existing.winners_announced
        };

        return this.giveawayRepository.update(id, payload);
    }

    async deleteGiveaway(id) {
        await this.getGiveawayById(id);
        const deleted = await this.giveawayRepository.delete(id);
        if (!deleted) {
            throw new AppError(`Failed to delete giveaway with ID ${id}.`, 500);
        }
        return { success: true, message: 'Giveaway deleted successfully' };
    }

    async extendEndDate(id, newEndDate) {
        await this.getGiveawayById(id);
        if (!newEndDate || isNaN(Date.parse(newEndDate))) {
            throw new AppError('Valid new closing date & time is required.', 400);
        }

        const dateObj = new Date(newEndDate);
        return this.giveawayRepository.extendEndDate(id, dateObj);
    }

    async manuallyClose(id) {
        await this.getGiveawayById(id);
        return this.giveawayRepository.manuallyClose(id);
    }

    async publishWinners(id, rawWinners) {
        const giveaway = await this.getGiveawayById(id);

        if (!Array.isArray(rawWinners) || rawWinners.length === 0) {
            throw new AppError('At least one winner is required.', 400);
        }

        const now = new Date().toISOString();
        const formattedWinners = rawWinners.map(w => ({
            name: w.name.trim(),
            email: w.email.trim().toLowerCase(),
            announced_at: now
        }));

        const updated = await this.giveawayRepository.publishWinners(id, formattedWinners);

        // Send winner emails asynchronously to avoid blocking the HTTP response
        let emailsSent = 0;
        for (const winner of formattedWinners) {
            try {
                const sent = await this.emailService.sendGiveawayWinnerEmail({
                    to: winner.email,
                    winnerName: winner.name,
                    giveawayTitle: giveaway.title
                });
                if (sent) emailsSent++;
            } catch (err) {
                console.error(`Error sending giveaway winner email to ${winner.email}:`, err.message);
            }
        }

        return {
            giveaway: updated,
            winners: formattedWinners,
            emails_sent: emailsSent,
            total_winners: formattedWinners.length
        };
    }
}

module.exports = new GiveawayService();

