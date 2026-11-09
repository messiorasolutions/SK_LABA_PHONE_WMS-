const pool = require('../config/db');

class ShopInfoRepository {
    async getShopInfo() {
        const query = `
            SELECT id, shop_name, tagline, address, opening_hours, email, whatsapp_number, phone_number, created_at, updated_at
            FROM shop_information
            WHERE id = 1
        `;
        const [rows] = await pool.query(query);

        if (rows.length > 0) {
            return rows[0];
        }

        // Auto-seed default record if empty
        const defaultInsert = `
            INSERT INTO shop_information (id, shop_name, tagline, address, opening_hours, email, whatsapp_number, phone_number)
            VALUES (1, 'SK LABA PHONE', 'ලාබ ෆෝන්', 'Dongdaemun-gu, Seoul, South Korea', 'Mon - Sun: 10:00 AM - 9:00 PM (KST)', 'contact@sklabaphone.com', '+82 10-5892-7482', '+82 10-5892-7482')
            ON DUPLICATE KEY UPDATE id=id
        `;
        await pool.query(defaultInsert);
        const [freshRows] = await pool.query(query);
        return freshRows[0] || null;
    }

    async updateShopInfo(data) {
        // Ensure record exists
        await this.getShopInfo();

        const query = `
            UPDATE shop_information
            SET 
                shop_name = COALESCE(?, shop_name),
                tagline = COALESCE(?, tagline),
                address = COALESCE(?, address),
                opening_hours = COALESCE(?, opening_hours),
                email = COALESCE(?, email),
                whatsapp_number = COALESCE(?, whatsapp_number),
                phone_number = COALESCE(?, phone_number)
            WHERE id = 1
        `;

        const values = [
            data.shop_name !== undefined ? data.shop_name : null,
            data.tagline !== undefined ? data.tagline : null,
            data.address !== undefined ? data.address : null,
            data.opening_hours !== undefined ? data.opening_hours : null,
            data.email !== undefined ? data.email : null,
            data.whatsapp_number !== undefined ? data.whatsapp_number : null,
            data.phone_number !== undefined ? data.phone_number : null
        ];

        await pool.execute(query, values);
        return this.getShopInfo();
    }
}

module.exports = new ShopInfoRepository();

