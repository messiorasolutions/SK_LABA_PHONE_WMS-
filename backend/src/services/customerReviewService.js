const defaultCustomerReviewRepository = require('../repositories/customerReviewRepository');
const defaultUserRepository = require('../repositories/dashboardUserRepository');
const AppError = require('../utils/customError');

class CustomerReviewService {
    constructor({
        customerReviewRepo = defaultCustomerReviewRepository,
        userRepo = defaultUserRepository
    } = {}) {
        this.customerReviewRepository = customerReviewRepo;
        this.userRepository = userRepo;
    }

    /**
     * Submit a public customer review (automatically assigned 'Pending' status)
     * @param {Object} data
     * @param {string} data.customer_name
     * @param {number} data.rating
     * @param {string} data.comment
     * @returns {Promise<Object>} Safe customer confirmation object
     */
    async submitReview({ customer_name, rating, comment }) {
        const created = await this.customerReviewRepository.create({
            customer_name,
            rating,
            comment,
            status: 'Pending'
        });

        // Return only safe customer-facing confirmation details
        return {
            review_id: created.review_id,
            customer_name: created.customer_name,
            rating: created.rating,
            comment: created.comment,
            status: created.status,
            created_at: created.created_at
        };
    }

    /**
     * Retrieve approved reviews for the public website
     * Enforces status = 'Approved' only
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=20]
     * @returns {Promise<Object>}
     */
    async getApprovedReviews({ page = 1, limit = 20 } = {}) {
        const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 50);
        const safePage = Math.max(1, Number(page) || 1);

        const reviews = await this.customerReviewRepository.findApprovedReviews({
            page: safePage,
            limit: safeLimit
        });

        const total = await this.customerReviewRepository.countApprovedReviews();
        const totalPages = Math.ceil(total / safeLimit) || 1;

        return {
            reviews,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages
            }
        };
    }

    /**
     * Retrieve all reviews for dashboard administration
     * Supports status filter, keyword search, sorting, and pagination
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async listReviewsForAdmin({
        page = 1,
        limit = 20,
        status = 'ALL',
        search = null,
        sortBy = 'created_at',
        sortOrder = 'DESC'
    } = {}) {
        const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
        const safePage = Math.max(1, Number(page) || 1);

        const reviews = await this.customerReviewRepository.findReviews({
            page: safePage,
            limit: safeLimit,
            status,
            search,
            sortBy,
            sortOrder
        });

        const total = await this.customerReviewRepository.countReviews({
            status,
            search
        });
        const totalPages = Math.ceil(total / safeLimit) || 1;

        return {
            reviews,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages
            }
        };
    }

    /**
     * Retrieve full details of an individual review by ID
     * @param {number|string} review_id
     * @returns {Promise<Object>}
     */
    async getReviewById(review_id) {
        const review = await this.customerReviewRepository.findById(review_id);
        if (!review) {
            throw new AppError(`Customer review with ID ${review_id} not found.`, 404);
        }
        return review;
    }

    /**
     * Moderate a customer review (Approve or Reject)
     * Requires authorized administrator
     * @param {number|string} review_id
     * @param {'Approved'|'Rejected'} status
     * @param {Object} authenticatedUser
     * @returns {Promise<Object>}
     */
    async moderateReview(review_id, status, authenticatedUser) {
        if (!authenticatedUser || !authenticatedUser.user_id) {
            throw new AppError('Unauthorized: Moderator credentials required.', 401);
        }

        const validStatuses = ['Approved', 'Rejected'];
        if (!validStatuses.includes(status)) {
            throw new AppError(`Invalid status '${status}'. Must be 'Approved' or 'Rejected'.`, 400);
        }

        const existing = await this.customerReviewRepository.findById(review_id);
        if (!existing) {
            throw new AppError(`Customer review with ID ${review_id} not found.`, 404);
        }

        const updated = await this.customerReviewRepository.updateStatus(
            review_id,
            status,
            authenticatedUser.user_id
        );

        return updated;
    }
}

module.exports = new CustomerReviewService();
module.exports.CustomerReviewService = CustomerReviewService;
