const specificationRepository = require('../repositories/specificationRepository');
const AppError = require('../utils/customError');

class SpecificationService {
    /**
     * Create a new specification
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async createSpecification({ specification_name, specification_type, description, is_active }) {
        const cleanName = specification_name.trim();
        const cleanType = specification_type.trim().toUpperCase();
        const cleanDesc = description !== undefined && description !== null && description.trim() !== ''
            ? description.trim()
            : null;
        const cleanIsActive = is_active !== undefined && is_active !== null
            ? Boolean(is_active)
            : true;

        // Check if name + type combination already exists
        const existing = await specificationRepository.findByNameAndType(cleanName, cleanType);
        if (existing) {
            throw new AppError(`Specification '${cleanName}' with type '${cleanType}' already exists.`, 409);
        }

        const newSpec = await specificationRepository.create({
            specification_name: cleanName,
            specification_type: cleanType,
            description: cleanDesc,
            is_active: cleanIsActive
        });

        return newSpec;
    }

    /**
     * Fetch all specifications (optionally filtered by type)
     * @param {string} [type]
     * @returns {Promise<Array>}
     */
    async getAllSpecifications(type) {
        let cleanType = null;
        if (type && typeof type === 'string') {
            const upper = type.trim().toUpperCase();
            if (upper === 'TECHNICAL' || upper === 'ACCESSORY') {
                cleanType = upper;
            }
        }
        return await specificationRepository.findAll(cleanType);
    }

    /**
     * Fetch a specification by ID
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async getSpecificationById(id) {
        const spec = await specificationRepository.findById(id);
        if (!spec) {
            throw new AppError(`Specification with ID ${id} not found.`, 404);
        }
        return spec;
    }

    /**
     * Update an existing specification
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async updateSpecification(id, data) {
        const existing = await specificationRepository.findById(id);
        if (!existing) {
            throw new AppError(`Specification with ID ${id} not found.`, 404);
        }

        const newName = data.specification_name !== undefined ? data.specification_name.trim() : existing.specification_name;
        const newType = data.specification_type !== undefined ? data.specification_type.trim().toUpperCase() : existing.specification_type;

        // Check uniqueness if either name or type changed
        if (newName.toLowerCase() !== existing.specification_name.toLowerCase() || newType !== existing.specification_type) {
            const inUse = await specificationRepository.findByNameAndType(newName, newType);
            if (inUse && String(inUse.specification_id) !== String(id)) {
                throw new AppError(`Specification '${newName}' with type '${newType}' already exists.`, 409);
            }
        }

        let newDesc = existing.description;
        if (data.description !== undefined) {
            newDesc = data.description !== null && data.description.trim() !== '' ? data.description.trim() : null;
        }

        let newIsActive = Boolean(existing.is_active);
        if (data.is_active !== undefined) {
            newIsActive = Boolean(data.is_active);
        }

        const updated = await specificationRepository.update(id, {
            specification_name: newName,
            specification_type: newType,
            description: newDesc,
            is_active: newIsActive
        });

        return updated;
    }

    /**
     * Delete a specification by ID
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async deleteSpecification(id) {
        const existing = await specificationRepository.findById(id);
        if (!existing) {
            throw new AppError(`Specification with ID ${id} not found.`, 404);
        }

        await specificationRepository.delete(id);
        return {
            specification_id: Number(id),
            specification_name: existing.specification_name,
            specification_type: existing.specification_type
        };
    }
}

module.exports = new SpecificationService();
