const shopInfoRepository = require('../repositories/shopInfoRepository');
const AppError = require('../utils/customError');

class ShopInfoService {
    async getShopInfo() {
        const info = await shopInfoRepository.getShopInfo();
        if (!info) {
            // Default fallback if database query returned null
            return {
                id: 1,
                shop_name: 'SK LABA PHONE',
                tagline: 'ලාබ ෆෝන්',
                address: 'Dongdaemun-gu, Seoul, South Korea',
                opening_hours: 'Mon - Sun: 10:00 AM - 9:00 PM (KST)',
                email: 'contact@sklabaphone.com',
                whatsapp_number: '+82 10-5892-7482',
                phone_number: '+82 10-5892-7482'
            };
        }
        return info;
    }

    async updateShopInfo(payload) {
        const sanitized = {
            shop_name: payload.shop_name !== undefined ? String(payload.shop_name).trim() : undefined,
            tagline: payload.tagline !== undefined ? String(payload.tagline).trim() : undefined,
            address: payload.address !== undefined ? String(payload.address).trim() : undefined,
            opening_hours: payload.opening_hours !== undefined ? String(payload.opening_hours).trim() : undefined,
            email: payload.email !== undefined ? String(payload.email).trim().toLowerCase() : undefined,
            whatsapp_number: payload.whatsapp_number !== undefined ? String(payload.whatsapp_number).trim() : undefined,
            phone_number: payload.phone_number !== undefined ? String(payload.phone_number).trim() : undefined
        };

        if (sanitized.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(sanitized.email)) {
                throw new AppError('Invalid email address format', 400);
            }
        }

        if (sanitized.whatsapp_number) {
            const digits = sanitized.whatsapp_number.replace(/\D/g, '');
            if (digits.length < 7 || digits.length > 18) {
                throw new AppError('WhatsApp number must contain between 7 and 18 digits (e.g. +82 10-5892-7482)', 400);
            }
        }

        if (sanitized.phone_number) {
            const digits = sanitized.phone_number.replace(/\D/g, '');
            if (digits.length < 7 || digits.length > 18) {
                throw new AppError('Phone number must contain between 7 and 18 digits', 400);
            }
        }

        return await shopInfoRepository.updateShopInfo(sanitized);
    }
}

module.exports = new ShopInfoService();

