const defaultInquiryRepository = require('../repositories/inquiryRepository');
const defaultPhoneRepository = require('../repositories/phoneRepository');
const defaultUserRepository = require('../repositories/dashboardUserRepository');
const AppError = require('../utils/customError');

class InquiryService {
    constructor({
        inquiryRepository = defaultInquiryRepository,
        phoneRepository = defaultPhoneRepository,
        userRepository = defaultUserRepository
    } = {}) {
        this.inquiryRepository = inquiryRepository;
        this.phoneRepository = phoneRepository;
        this.userRepository = userRepository;
    }

    /**
     * Submit a public customer inquiry
     * @param {Object} data
     * @param {string} data.name
     * @param {string} data.phone_number
     * @param {string} data.message
     * @param {number|null} [data.phone_id]
     * @returns {Promise<Object>} Created safe inquiry record
     */
    async createInquiry({ name, phone_number, message, phone_id = null }) {
        // If phone-specific inquiry, verify that referenced phone exists
        if (phone_id) {
            const phone = await this.phoneRepository.findById(phone_id);
            if (!phone) {
                throw new AppError('Referenced phone does not exist.', 404);
            }
        }

        const inquiry = await this.inquiryRepository.create({
            customer_name: name,
            phone_number,
            message,
            phone_id: phone_id || null
        });

        return inquiry;
    }

    /**
     * List inquiries with pagination, searching, and filtering
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @param {string} [options.search]
     * @param {string} [options.status]
     * @param {number|string} [options.assigned_to_user_id]
     * @returns {Promise<{ inquiries: Array, pagination: Object }>}
     */
    async listInquiries(options = {}) {
        const { page = 1, limit = 10, search, status, assigned_to_user_id } = options;

        return await this.inquiryRepository.findInquiries({
            page,
            limit,
            search,
            status,
            assigned_to_user_id
        });
    }

    /**
     * Retrieve complete details of an individual inquiry by ID
     * @param {number|string} inquiryId
     * @returns {Promise<Object>}
     */
    async getInquiryById(inquiryId) {
        const inquiry = await this.inquiryRepository.findById(inquiryId);

        if (!inquiry) {
            throw new AppError('Inquiry not found.', 404);
        }

        return inquiry;
    }

    /**
     * Update inquiry status and record staff attribution
     * @param {number|string} inquiryId
     * @param {Object} updateData
     * @param {string} updateData.status
     * @param {number|null} [updateData.assigned_to_user_id]
     * @param {number|string} authenticatedUserId - From server session, never from client body
     * @returns {Promise<Object>} Updated inquiry
     */
    async updateInquiryStatus(inquiryId, { status, assigned_to_user_id }, authenticatedUserId) {
        if (!authenticatedUserId) {
            throw new AppError('Unauthorized: Authenticated staff member identity is required.', 401);
        }

        const existing = await this.inquiryRepository.findById(inquiryId);
        if (!existing) {
            throw new AppError('Inquiry not found.', 404);
        }

        // If assigned_to_user_id is provided, confirm assigned user exists and is active
        if (assigned_to_user_id !== undefined && assigned_to_user_id !== null) {
            const assignedUser = await this.userRepository.findById(assigned_to_user_id);
            if (!assignedUser) {
                throw new AppError('Assigned staff member does not exist.', 404);
            }
            if (!assignedUser.is_active) {
                throw new AppError('Cannot assign inquiry to an inactive user account.', 400);
            }
        }

        const updated = await this.inquiryRepository.updateStatus(inquiryId, {
            status,
            updated_by_user_id: authenticatedUserId,
            assigned_to_user_id
        });

        return updated;
    }
}

const defaultInquiryService = new InquiryService();

module.exports = defaultInquiryService;
module.exports.InquiryService = InquiryService;
