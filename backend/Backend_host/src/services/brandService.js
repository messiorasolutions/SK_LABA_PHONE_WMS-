const brandRepository = require('../repositories/brandRepository');
const AppError = require('../utils/customError');

class BrandService {
    /**
     * Create a new brand
     * @param {Object} data
     * @param {string} data.brand_name
     * @param {string} [data.description]
     * @param {boolean} [data.is_active=true]
     * @returns {Promise<Object>} Created brand
     */
    async createBrand({ brand_name, description, is_active }) {
        const cleanBrandName = brand_name.trim();
        const cleanDescription = description !== undefined && description !== null && description.trim() !== ''
            ? description.trim()
            : null;
        const cleanIsActive = is_active !== undefined && is_active !== null
            ? Boolean(is_active)
            : true;

        // Check for existing brand name
        const existingBrand = await brandRepository.findByName(cleanBrandName);
        if (existingBrand) {
            throw new AppError(`Brand '${cleanBrandName}' already exists.`, 409);
        }

        const newBrand = await brandRepository.create({
            brand_name: cleanBrandName,
            description: cleanDescription,
            is_active: cleanIsActive
        });

        return newBrand;
    }

    /**
     * Fetch all brands
     * @returns {Promise<Array>}
     */
    async getAllBrands() {
        return await brandRepository.findAll();
    }

    /**
     * Fetch a brand by ID
     * @param {number|string} brandId
     * @returns {Promise<Object>}
     */
    async getBrandById(brandId) {
        const brand = await brandRepository.findById(brandId);
        if (!brand) {
            throw new AppError(`Brand with ID ${brandId} not found.`, 404);
        }
        return brand;
    }

    /**
     * Update an existing brand
     * @param {number|string} brandId
     * @param {Object} data
     * @returns {Promise<Object>} Updated brand
     */
    async updateBrand(brandId, data) {
        const existing = await brandRepository.findById(brandId);
        if (!existing) {
            throw new AppError(`Brand with ID ${brandId} not found.`, 404);
        }

        let updatedName = existing.brand_name;
        if (data.brand_name !== undefined) {
            const cleanName = data.brand_name.trim();
            if (cleanName.toLowerCase() !== existing.brand_name.toLowerCase()) {
                const nameInUse = await brandRepository.findByName(cleanName);
                if (nameInUse && String(nameInUse.brand_id) !== String(brandId)) {
                    throw new AppError(`Brand '${cleanName}' already exists.`, 409);
                }
            }
            updatedName = cleanName;
        }

        let updatedDescription = existing.description;
        if (data.description !== undefined) {
            updatedDescription = data.description !== null && data.description.trim() !== ''
                ? data.description.trim()
                : null;
        }

        let updatedIsActive = Boolean(existing.is_active);
        if (data.is_active !== undefined) {
            updatedIsActive = Boolean(data.is_active);
        }

        const updatedBrand = await brandRepository.update(brandId, {
            brand_name: updatedName,
            description: updatedDescription,
            is_active: updatedIsActive
        });

        return updatedBrand;
    }

    /**
     * Delete a brand by ID
     * @param {number|string} brandId
     * @returns {Promise<Object>} Deleted brand details
     */
    async deleteBrand(brandId) {
        const existing = await brandRepository.findById(brandId);
        if (!existing) {
            throw new AppError(`Brand with ID ${brandId} not found.`, 404);
        }

        await brandRepository.delete(brandId);
        return {
            brand_id: Number(brandId),
            brand_name: existing.brand_name
        };
    }
}

module.exports = new BrandService();
