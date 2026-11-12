const defaultSellRequestRepository = require('../repositories/sellRequestRepository');
const defaultPhoneRepository = require('../repositories/phoneRepository');
const defaultUserRepository = require('../repositories/dashboardUserRepository');
const { cleanupFiles } = require('../middleware/uploadMiddleware');
const { VALID_STATUSES } = require('../validations/sellRequestValidation');
const AppError = require('../utils/customError');

class SellRequestService {
    constructor({
        sellRequestRepository = defaultSellRequestRepository,
        phoneRepository = defaultPhoneRepository,
        userRepository = defaultUserRepository,
        cleanupHandler = cleanupFiles
    } = {}) {
        this.sellRequestRepository = sellRequestRepository;
        this.phoneRepository = phoneRepository;
        this.userRepository = userRepository;
        this.cleanupHandler = cleanupHandler;
    }

    /**
     * Submit a public customer sell-your-phone request 
     * Performs optional phone existence check and compensating file cleanup on failure.
     */
    async createSellRequest(data, uploadedPhotoPaths = []) {
        try {
            // If the customer optionally selected a phone they wish to purchase/trade for
            if (data.desired_phone_id) {
                const phone = await this.phoneRepository.findById(data.desired_phone_id);
                if (!phone) {
                    throw new AppError('The desired phone selected for trade-in does not exist.', 404);
                }
            }

            // Persist the request to the database
            const created = await this.sellRequestRepository.create({
                customer_name: data.customer_name,
                phone_number: data.phone_number,
                brand_and_model: data.brand_and_model,
                brand: data.brand || null,
                model: data.model || null,
                storage_capacity: data.storage_capacity,
                phone_condition: data.phone_condition,
                battery_health: data.battery_health,
                description: data.description || null,
                photos: data.photos || null,
                desired_phone_id: data.desired_phone_id || null
            });

            return created;
        } catch (error) {
            // Compensating action: clean up newly created photo files if database insertion fails
            if (Array.isArray(uploadedPhotoPaths) && uploadedPhotoPaths.length > 0) {
                await this.cleanupHandler(uploadedPhotoPaths);
            }
            throw error;
        }
    }

    /**
     * List sell-your-phone requests with pagination, searching, and filtering 
     */
    async listSellRequests(filters = {}) {
        return await this.sellRequestRepository.findSellRequests(filters);
    }

    /**
     * Retrieve complete details of an individual sell-your-phone request 
     */
    async getSellRequestById(requestId) {
        const request = await this.sellRequestRepository.findById(requestId);
        if (!request) {
            throw new AppError('Sell-your-phone request not found.', 404);
        }
        return request;
    }

    /**
     * Update sell request status and staff audit attribution 
     */
    async updateSellRequestStatus(requestId, updateData, authenticatedUserId) {
        if (!authenticatedUserId) {
            throw new AppError('Authentication required to perform status update.', 401);
        }

        const existing = await this.sellRequestRepository.findById(requestId);
        if (!existing) {
            throw new AppError('Sell-your-phone request not found.', 404);
        }

        const { status, assigned_to_user_id } = updateData;

        // Verify status is among the 5 exact SRS statuses
        if (!VALID_STATUSES.includes(status)) {
            throw new AppError(`Invalid status '${status}'. Allowed statuses are: ${VALID_STATUSES.join(', ')}`, 400);
        }

        // If assigning or reassigning staff, verify the target user exists and is active
        if (assigned_to_user_id !== undefined && assigned_to_user_id !== null) {
            const staffUser = await this.userRepository.findById(assigned_to_user_id);
            if (!staffUser) {
                throw new AppError('Assigned staff member not found.', 404);
            }
            if (!staffUser.is_active) {
                throw new AppError('Cannot assign sell request to an inactive staff member.', 400);
            }
        }

        const updated = await this.sellRequestRepository.updateStatus(requestId, {
            status,
            updated_by_user_id: authenticatedUserId,
            assigned_to_user_id
        });

        return updated;
    }

    /**
     * Assign sell-your-phone request to a staff member
     */
    async assignSellRequest(requestId, assignedToUserId, authenticatedUserId) {
        if (!authenticatedUserId) {
            throw new AppError('Authentication required to assign sell request.', 401);
        }

        const existing = await this.sellRequestRepository.findById(requestId);
        if (!existing) {
            throw new AppError('Sell-your-phone request not found.', 404);
        }

        if (assignedToUserId !== null && assignedToUserId !== undefined) {
            const staffUser = await this.userRepository.findById(assignedToUserId);
            if (!staffUser) {
                throw new AppError('Assigned staff member not found.', 404);
            }
            if (!staffUser.is_active) {
                throw new AppError('Cannot assign sell request to an inactive staff member.', 400);
            }
        }

        const updated = await this.sellRequestRepository.updateAssignment(requestId, {
            assigned_to_user_id: assignedToUserId,
            updated_by_user_id: authenticatedUserId
        });

        return updated;
    }
}

const defaultSellRequestService = new SellRequestService();

module.exports = defaultSellRequestService;
module.exports.SellRequestService = SellRequestService;
