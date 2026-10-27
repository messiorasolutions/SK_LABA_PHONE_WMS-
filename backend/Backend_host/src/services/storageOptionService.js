const storageOptionRepository = require('../repositories/storageOptionRepository');
const AppError = require('../utils/customError');

class StorageOptionService {
    /**
     * Create a new storage option
     * @param {Object} data
     * @param {string} data.storage_name
     * @param {number} data.capacity_gb
     * @returns {Promise<Object>}
     */
    async createStorageOption({ storage_name, capacity_gb }) {
        const cleanName = storage_name.trim();
        const numericCapacity = Number(capacity_gb);

        // Check if storage option with name already exists
        const existing = await storageOptionRepository.findByName(cleanName);
        if (existing) {
            throw new AppError(`Storage option '${cleanName}' already exists.`, 409);
        }

        const newOption = await storageOptionRepository.create({
            storage_name: cleanName,
            capacity_gb: numericCapacity
        });

        return newOption;
    }

    /**
     * Get all storage options
     * @returns {Promise<Array>}
     */
    async getAllStorageOptions() {
        return await storageOptionRepository.findAll();
    }

    /**
     * Get a storage option by ID
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async getStorageOptionById(id) {
        const option = await storageOptionRepository.findById(id);
        if (!option) {
            throw new AppError(`Storage option with ID ${id} not found.`, 404);
        }
        return option;
    }

    /**
     * Update an existing storage option
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async updateStorageOption(id, data) {
        const existing = await storageOptionRepository.findById(id);
        if (!existing) {
            throw new AppError(`Storage option with ID ${id} not found.`, 404);
        }

        let updatedName = existing.storage_name;
        if (data.storage_name !== undefined) {
            const cleanName = data.storage_name.trim();
            if (cleanName.toLowerCase() !== existing.storage_name.toLowerCase()) {
                const nameInUse = await storageOptionRepository.findByName(cleanName);
                if (nameInUse && String(nameInUse.storage_id) !== String(id)) {
                    throw new AppError(`Storage option '${cleanName}' already exists.`, 409);
                }
            }
            updatedName = cleanName;
        }

        let updatedCapacity = existing.capacity_gb;
        if (data.capacity_gb !== undefined) {
            updatedCapacity = Number(data.capacity_gb);
        }

        const updatedOption = await storageOptionRepository.update(id, {
            storage_name: updatedName,
            capacity_gb: updatedCapacity
        });

        return updatedOption;
    }

    /**
     * Delete a storage option by ID
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async deleteStorageOption(id) {
        const existing = await storageOptionRepository.findById(id);
        if (!existing) {
            throw new AppError(`Storage option with ID ${id} not found.`, 404);
        }

        await storageOptionRepository.delete(id);
        return {
            storage_id: Number(id),
            storage_name: existing.storage_name
        };
    }
}

module.exports = new StorageOptionService();
