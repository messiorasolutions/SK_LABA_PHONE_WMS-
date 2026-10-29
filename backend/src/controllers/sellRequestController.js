const fs = require('fs');
const path = require('path');
const defaultSellRequestService = require('../services/sellRequestService');
const { UPLOAD_DIR, STORAGE_PREFIX } = require('../middleware/uploadMiddleware');
const AppError = require('../utils/customError');

class SellRequestController {
    constructor(sellRequestService = defaultSellRequestService) {
        this.sellRequestService = sellRequestService;
    }

    /**
     * POST /api/sell-requests
     * Public customer sell-your-phone submission 
     */
    async createSellRequest(req, res, next) {
        try {
            const created = await this.sellRequestService.createSellRequest(
                req.body,
                req.uploadedPhotoPaths || []
            );

            return res.status(201).json({
                success: true,
                message: 'Your sell request has been received. Our team will review the details and contact you with a valuation quote.',
                data: created
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/sell-requests
     * Protected dashboard endpoint: list sell requests with pagination, searching, and filtering 
     */
    async listSellRequests(req, res, next) {
        try {
            const {
                page,
                limit,
                search,
                status,
                desired_phone_id,
                assigned_to_user_id,
                from_date,
                to_date
            } = req.query;

            const result = await this.sellRequestService.listSellRequests({
                page,
                limit,
                search,
                status,
                desired_phone_id,
                assigned_to_user_id,
                from_date,
                to_date
            });

            return res.status(200).json({
                success: true,
                data: result.requests,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/sell-requests/:id
     * Protected dashboard endpoint: retrieve complete sell request details 
     */
    async getSellRequestById(req, res, next) {
        try {
            const { id } = req.params;
            const request = await this.sellRequestService.getSellRequestById(id);

            return res.status(200).json({
                success: true,
                data: request
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/sell-requests/:id/photos/:filename
     * Protected dashboard endpoint: private authorized access to customer trade-in photos
     */
    async getSellRequestPhoto(req, res, next) {
        try {
            const { id, filename } = req.params;

            // Retrieve sell request
            const request = await this.sellRequestService.getSellRequestById(id);

            // Prevent path traversal
            const safeFilename = path.basename(filename);
            if (!safeFilename || safeFilename !== filename) {
                return next(new AppError('Invalid photo filename requested.', 400));
            }

            // Verify photo belongs to this request
            const expectedKey = `${STORAGE_PREFIX}/${safeFilename}`;
            const photoList = Array.isArray(request.photos) ? request.photos : [];
            const matches = photoList.some((p) => p === expectedKey || path.basename(p) === safeFilename);

            if (!matches) {
                return next(new AppError('Photo not associated with this sell request.', 404));
            }

            const fullPath = path.join(UPLOAD_DIR, safeFilename);
            if (!fs.existsSync(fullPath)) {
                return next(new AppError('Photo file not found on storage.', 404));
            }

            // Deliver file securely with private caching
            res.setHeader('Cache-Control', 'private, no-transform, max-age=86400');
            return res.sendFile(fullPath);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/sell-requests/:id/status
     * Protected dashboard endpoint: update sell request status 
     */
    async updateSellRequestStatus(req, res, next) {
        try {
            const { id } = req.params;
            const staffUserId = req.user ? req.user.user_id : null;

            const updated = await this.sellRequestService.updateSellRequestStatus(
                id,
                req.body,
                staffUserId
            );

            return res.status(200).json({
                success: true,
                message: 'Sell request status updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/sell-requests/:id/assign
     * Protected dashboard endpoint: assign or reassign request to staff
     */
    async assignSellRequest(req, res, next) {
        try {
            const { id } = req.params;
            const staffUserId = req.user ? req.user.user_id : null;

            const updated = await this.sellRequestService.assignSellRequest(
                id,
                req.body.assigned_to_user_id,
                staffUserId
            );

            return res.status(200).json({
                success: true,
                message: 'Sell request assigned successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }
}

const defaultSellRequestController = new SellRequestController();

module.exports = defaultSellRequestController;
module.exports.SellRequestController = SellRequestController;
