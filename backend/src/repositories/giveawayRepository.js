const pool = require('../config/db');

class GiveawayRepository {
    _formatGiveaway(row) {
        if (!row) return null;
        const formatted = { ...row };

        // Parse winners JSON
        if (formatted.winners && typeof formatted.winners === 'string') {
            try {
                formatted.winners = JSON.parse(formatted.winners);
            } catch (e) {
                formatted.winners = [];
            }
        } else if (!formatted.winners) {
            formatted.winners = [];
        }

        formatted.is_manually_closed = Boolean(formatted.is_manually_closed);
        formatted.winners_announced = Boolean(formatted.winners_announced);

        // Dynamically compute effective status if not draft
        const now = new Date();
        const start = new Date(formatted.start_date);
        const end = new Date(formatted.end_date);

        if (formatted.status === 'DRAFT') {
            formatted.calculated_status = 'DRAFT';
        } else if (formatted.is_manually_closed || formatted.status === 'CLOSED') {
            formatted.calculated_status = 'CLOSED';
        } else if (formatted.winners_announced || now > end) {
            formatted.calculated_status = 'COMPLETED';
        } else if (now >= start && now <= end) {
            formatted.calculated_status = 'ONGOING';
        } else if (now < start) {
            formatted.calculated_status = 'UPCOMING';
        } else {
            formatted.calculated_status = formatted.status;
        }

        return formatted;
    }

    async findAll(filters = {}) {
        let query = `SELECT * FROM giveaways WHERE 1=1`;
        const values = [];

        if (filters.status && filters.status !== 'ALL') {
            const cleanStatus = String(filters.status).trim().toUpperCase();
            if (cleanStatus === 'DRAFT') {
                query += ` AND status = 'DRAFT'`;
            } else if (cleanStatus === 'CLOSED') {
                query += ` AND (is_manually_closed = 1 OR status = 'CLOSED')`;
            } else if (cleanStatus === 'COMPLETED') {
                query += ` AND (status = 'COMPLETED' OR winners_announced = 1 OR (NOW() > end_date AND status != 'DRAFT'))`;
            } else if (cleanStatus === 'ONGOING') {
                query += ` AND status != 'DRAFT' AND is_manually_closed = 0 AND winners_announced = 0 AND NOW() <= end_date`;
            } else {
                query += ` AND status = ?`;
                values.push(cleanStatus);
            }
        }

        if (filters.search) {
            query += ` AND (title LIKE ? OR short_description LIKE ?)`;
            const keyword = `%${filters.search}%`;
            values.push(keyword, keyword);
        }

        // Default sort: Ongoing first, then newest
        query += ` ORDER BY 
            CASE 
                WHEN is_manually_closed = 0 AND winners_announced = 0 AND NOW() <= end_date AND status != 'DRAFT' THEN 1 
                ELSE 2 
            END ASC, 
            giveaway_id DESC`;

        const [rows] = await pool.execute(query, values);
        return rows.map(r => this._formatGiveaway(r));
    }

    async findById(giveaway_id) {
        const query = `SELECT * FROM giveaways WHERE giveaway_id = ?`;
        const [rows] = await pool.execute(query, [giveaway_id]);
        return rows.length > 0 ? this._formatGiveaway(rows[0]) : null;
    }

    async create(data) {
        const query = `
            INSERT INTO giveaways (
                title, short_description, description, thumbnail_url,
                start_date, end_date, winner_selection_date, status,
                is_manually_closed, winners_announced, winners
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.title,
            data.short_description || null,
            data.description || null,
            data.thumbnail_url || null,
            data.start_date,
            data.end_date,
            data.winner_selection_date,
            data.status || 'DRAFT',
            data.is_manually_closed ? 1 : 0,
            data.winners_announced ? 1 : 0,
            data.winners ? JSON.stringify(data.winners) : JSON.stringify([])
        ];

        const [result] = await pool.execute(query, values);
        return this.findById(result.insertId);
    }

    async update(giveaway_id, data) {
        const query = `
            UPDATE giveaways SET
                title = ?,
                short_description = ?,
                description = ?,
                thumbnail_url = ?,
                start_date = ?,
                end_date = ?,
                winner_selection_date = ?,
                status = ?,
                is_manually_closed = ?,
                winners_announced = ?
            WHERE giveaway_id = ?
        `;

        const values = [
            data.title,
            data.short_description || null,
            data.description || null,
            data.thumbnail_url || null,
            data.start_date,
            data.end_date,
            data.winner_selection_date,
            data.status,
            data.is_manually_closed ? 1 : 0,
            data.winners_announced ? 1 : 0,
            giveaway_id
        ];

        await pool.execute(query, values);
        return this.findById(giveaway_id);
    }

    async delete(giveaway_id) {
        const query = `DELETE FROM giveaways WHERE giveaway_id = ?`;
        const [result] = await pool.execute(query, [giveaway_id]);
        return result.affectedRows > 0;
    }

    async extendEndDate(giveaway_id, new_end_date) {
        const query = `
            UPDATE giveaways SET
                end_date = ?,
                is_manually_closed = 0,
                status = CASE WHEN status = 'CLOSED' OR status = 'COMPLETED' THEN 'ONGOING' ELSE status END
            WHERE giveaway_id = ?
        `;
        await pool.execute(query, [new_end_date, giveaway_id]);
        return this.findById(giveaway_id);
    }

    async manuallyClose(giveaway_id) {
        const query = `
            UPDATE giveaways SET
                is_manually_closed = 1,
                status = 'CLOSED'
            WHERE giveaway_id = ?
        `;
        await pool.execute(query, [giveaway_id]);
        return this.findById(giveaway_id);
    }

    async publishWinners(giveaway_id, winnersList) {
        const query = `
            UPDATE giveaways SET
                winners = ?,
                winners_announced = 1,
                winners_announced_at = NOW(),
                status = 'COMPLETED'
            WHERE giveaway_id = ?
        `;
        await pool.execute(query, [JSON.stringify(winnersList), giveaway_id]);
        return this.findById(giveaway_id);
    }

    async getDashboardOverview() {
        const [totalRows] = await pool.execute(`SELECT COUNT(*) as total FROM giveaways`);
        const [ongoingRows] = await pool.execute(`
            SELECT COUNT(*) as ongoing 
            FROM giveaways 
            WHERE status != 'DRAFT' AND is_manually_closed = 0 AND winners_announced = 0 AND NOW() <= end_date
        `);
        const [completedRows] = await pool.execute(`
            SELECT COUNT(*) as completed 
            FROM giveaways 
            WHERE status = 'COMPLETED' OR winners_announced = 1 OR (NOW() > end_date AND status != 'DRAFT' AND is_manually_closed = 0)
        `);
        const [winnerRows] = await pool.execute(`
            SELECT winners
            FROM giveaways 
            WHERE winners_announced = 1 AND winners IS NOT NULL
        `);

        let totalWinnersCount = 0;
        winnerRows.forEach(row => {
            try {
                const parsed = typeof row.winners === 'string' ? JSON.parse(row.winners) : row.winners;
                if (Array.isArray(parsed)) {
                    totalWinnersCount += parsed.length;
                }
            } catch (e) {}
        });

        return {
            total_giveaways: totalRows[0]?.total || 0,
            ongoing_giveaways: ongoingRows[0]?.ongoing || 0,
            completed_giveaways: completedRows[0]?.completed || 0,
            total_winners_announced: totalWinnersCount,
        };
    }
}

module.exports = new GiveawayRepository();

