const defaultService = require('../services/backInStockRequestService');

class BackInStockRequestController {
    constructor(service = defaultService) {
        this.service = service;
    }

    /**
     * POST /api/back-in-stock-requests
     * Public customer back-in-stock notification submission
     */
    async createRequest(req, res, next) {
        try {
            const request = await this.service.createRequest(req.body);
            return res.status(201).json({
                success: true,
                message: 'Back-in-stock notification request received successfully. We will notify you when this item is back in stock.',
                data: request
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/back-in-stock-requests
     * Protected dashboard endpoint: list requests with pagination, searching, and filtering
     */
    async listRequests(req, res, next) {
        try {
            const { page, limit, search, status, phone_id, assigned_to_user_id, grouped } = req.query;

            const result = await this.service.listRequests({
                page,
                limit,
                search,
                status,
                phone_id,
                assigned_to_user_id,
                grouped
            });

            return res.status(200).json({
                success: true,
                data: result.requests || result.phones,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/back-in-stock-requests/grouped-by-phone
     * Protected dashboard endpoint: list requests grouped by phone with waiting customer counts
     */
    async listRequestsGroupedByPhone(req, res, next) {
        try {
            const { search, page, limit } = req.query;
            const result = await this.service.listRequestsGroupedByPhone({
                search,
                page,
                limit
            });

            return res.status(200).json({
                success: true,
                data: result.phones,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/back-in-stock-requests/:id
     * Protected dashboard endpoint: retrieve complete details of an individual request
     */
    async getRequestById(req, res, next) {
        try {
            const { id } = req.params;
            const request = await this.service.getRequestById(id);

            return res.status(200).json({
                success: true,
                data: request
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/back-in-stock-requests/phones/:phoneId
     * Protected dashboard endpoint: retrieve waiting customers for a specific phone
     */
    async getWaitingCustomersForPhone(req, res, next) {
        try {
            const phoneId = req.params.phoneId || req.params.id;
            const result = await this.service.getWaitingCustomersForPhone(phoneId);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/back-in-stock-requests/:id/status
     * Protected dashboard endpoint: mark an individual request as Contacted
     */
    async updateRequestStatus(req, res, next) {
        try {
            const { id } = req.params;
            const authenticatedUserId = req.user
                ? req.user.user_id
                : (req.session ? req.session.userId : null);

            const updated = await this.service.updateRequestStatus(id, req.body || {}, authenticatedUserId);

            return res.status(200).json({
                success: true,
                message: "Back-in-stock request marked as 'Contacted'.",
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/back-in-stock-requests/:id/assign
     * Protected dashboard endpoint: assign request to a staff member
     */
    async assignRequest(req, res, next) {
        try {
            const { id } = req.params;
            const authenticatedUserId = req.user
                ? req.user.user_id
                : (req.session ? req.session.userId : null);

            const updated = await this.service.assignRequest(id, req.body, authenticatedUserId);

            return res.status(200).json({
                success: true,
                message: 'Request assigned successfully.',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }
}

const defaultController = new BackInStockRequestController();

module.exports = defaultController;
module.exports.BackInStockRequestController = BackInStockRequestController;
