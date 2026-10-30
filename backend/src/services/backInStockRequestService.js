const defaultBackInStockRequestRepository = require('../repositories/backInStockRequestRepository');
const defaultPhoneRepository = require('../repositories/phoneRepository');
const defaultUserRepository = require('../repositories/dashboardUserRepository');
const AppError = require('../utils/customError');

class BackInStockRequestService {
    constructor({
        backInStockRequestRepository = defaultBackInStockRequestRepository,
        phoneRepository = defaultPhoneRepository,
        userRepository = defaultUserRepository
    } = {}) {
        this.backInStockRequestRepository = backInStockRequestRepository;
        this.phoneRepository = phoneRepository;
        this.userRepository = userRepository;
    }

    /**
     * Submit a public customer back-in-stock notification request
     * @param {Object} data
     * @param {number} data.phone_id
     * @param {string} data.customer_name
     * @param {string} data.phone_number
     * @param {string|null} [data.email]
     * @param {string|null} [data.notes]
     * @returns {Promise<Object>} Safe created request record
     */
    async createRequest({ phone_id, customer_name, phone_number, email = null, notes = null }) {
        // 1. Verify that referenced phone exists
        const phone = await this.phoneRepository.findById(phone_id);
        if (!phone) {
            throw new AppError(`Phone with ID ${phone_id} not found.`, 404);
        }

        // 2. Reject archived phones
        if (phone.is_archived === 1 || phone.is_archived === true || phone.status === 'ARCHIVED') {
            throw new AppError('The selected phone is archived and not eligible for back-in-stock notification requests.', 400);
        }

        // 3. Verify phone availability eligibility:
        // Must be currently SOLD_OUT or have zero available stock
        const rawStock = phone.current_stock !== undefined ? phone.current_stock : phone.stock_quantity;
        const currentStock = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock))
            ? Number(rawStock)
            : 0;

        const isSoldOut = phone.availability === 'SOLD_OUT' || currentStock <= 0;

        if (!isSoldOut) {
            throw new AppError('The selected phone is currently in stock. Back-in-stock requests can only be placed for sold-out phones.', 400);
        }

        // 4. Repeated submission handling:
        // Avoid arbitrary duplicate suppression that rejects legitimate requests.
        // We create the request with 'Pending' status. If the customer has submitted previously,
        // this allows capturing repeated customer interest without crashing or blocking.
        // Waiting customer metrics use COUNT(DISTINCT phone_number) so metrics accurately reflect unique waiting customers.
        const request = await this.backInStockRequestRepository.create({
            phone_id,
            customer_name,
            phone_number,
            email,
            status: 'Pending',
            notes
        });

        return request;
    }

    /**
     * List back-in-stock requests with pagination, searching, and filtering
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @param {string} [options.search]
     * @param {string} [options.status]
     * @param {number|string} [options.phone_id]
     * @param {number|string} [options.assigned_to_user_id]
     * @param {boolean|string} [options.grouped]
     * @returns {Promise<Object>}
     */
    async listRequests(options = {}) {
        const { grouped, page = 1, limit = 10, search, status, phone_id, assigned_to_user_id } = options;

        if (grouped === true || grouped === 'true') {
            return await this.listRequestsGroupedByPhone({ search, page, limit });
        }

        return await this.backInStockRequestRepository.findRequests({
            page,
            limit,
            search,
            status,
            phone_id,
            assigned_to_user_id
        });
    }

    /**
     * List back-in-stock requests grouped by phone with waiting counts
     * @param {Object} options
     * @param {string} [options.search]
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @returns {Promise<{ phones: Array, pagination: Object }>}
     */
    async listRequestsGroupedByPhone(options = {}) {
        const { search, page = 1, limit = 10 } = options;
        return await this.backInStockRequestRepository.findRequestsGroupedByPhone({
            search,
            page,
            limit
        });
    }

    /**
     * Retrieve complete details of an individual request by ID
     * @param {number|string} requestId
     * @returns {Promise<Object>}
     */
    async getRequestById(requestId) {
        const request = await this.backInStockRequestRepository.findById(requestId);

        if (!request) {
            throw new AppError('Back-in-stock request not found.', 404);
        }

        return request;
    }

    /**
     * Retrieve phone details along with its waiting customers
     * @param {number|string} phoneId
     * @returns {Promise<Object>}
     */
    async getWaitingCustomersForPhone(phoneId) {
        const phone = await this.phoneRepository.findById(phoneId);
        if (!phone) {
            throw new AppError(`Phone with ID ${phoneId} not found.`, 404);
        }

        const waitingCount = await this.backInStockRequestRepository.countWaitingByPhoneId(phoneId);
        const waitingCustomers = await this.backInStockRequestRepository.findByPhoneId(phoneId, 'Pending');

        return {
            phone: {
                phone_id: phone.phone_id,
                name: phone.name,
                brand_id: phone.brand_id,
                brand_name: phone.brand_name || null,
                availability: phone.availability,
                current_stock: Number(phone.current_stock || 0),
                price: phone.price !== undefined ? Number(phone.price) : null
            },
            waiting_customers_count: waitingCount,
            waiting_customers: waitingCustomers
        };
    }

    /**
     * Update request status (e.g. mark as Contacted) with staff attribution
     * @param {number|string} requestId
     * @param {Object} updateData
     * @param {string} [updateData.status='Contacted']
     * @param {string|null} [updateData.notes]
     * @param {number|string} authenticatedUserId
     * @returns {Promise<Object>} Updated request
     */
    async updateRequestStatus(requestId, { status = 'Contacted', notes = null } = {}, authenticatedUserId) {
        const existing = await this.backInStockRequestRepository.findById(requestId);
        if (!existing) {
            throw new AppError('Back-in-stock request not found.', 404);
        }

        // Validate exact workflow status
        if (status !== 'Contacted') {
            throw new AppError("Invalid status. Back-in-stock requests can only be marked as 'Contacted'.", 400);
        }

        const updated = await this.backInStockRequestRepository.updateStatus(requestId, {
            status: 'Contacted',
            updated_by_user_id: authenticatedUserId,
            notes: notes !== null && notes !== undefined ? notes : existing.notes
        });

        return updated;
    }

    /**
     * Assign request to a dashboard staff member
     * @param {number|string} requestId
     * @param {Object} assignData
     * @param {number} assignData.assigned_to_user_id
     * @param {number|string} authenticatedUserId
     * @returns {Promise<Object>}
     */
    async assignRequest(requestId, { assigned_to_user_id }, authenticatedUserId) {
        const existing = await this.backInStockRequestRepository.findById(requestId);
        if (!existing) {
            throw new AppError('Back-in-stock request not found.', 404);
        }

        const targetUser = await this.userRepository.findById(assigned_to_user_id);
        if (!targetUser) {
            throw new AppError(`User with ID ${assigned_to_user_id} not found.`, 404);
        }

        if (!targetUser.is_active) {
            throw new AppError('Cannot assign request to an inactive staff member.', 400);
        }

        const updated = await this.backInStockRequestRepository.assignStaff(requestId, {
            assigned_to_user_id: Number(assigned_to_user_id),
            updated_by_user_id: authenticatedUserId
        });

        return updated;
    }
}

const defaultService = new BackInStockRequestService();

module.exports = defaultService;
module.exports.BackInStockRequestService = BackInStockRequestService;
