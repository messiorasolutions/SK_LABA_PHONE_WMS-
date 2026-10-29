const defaultInquiryService = require('../services/inquiryService');

class InquiryController {
    constructor(inquiryService = defaultInquiryService) {
        this.inquiryService = inquiryService;
    }

    /**
     * POST /api/inquiries
     * Public customer inquiry submission
     */
    async createInquiry(req, res, next) {
        try {
            const { name, phone_number, message, phone_id } = req.body;

            const inquiry = await this.inquiryService.createInquiry({
                name,
                phone_number,
                message,
                phone_id
            });

            return res.status(201).json({
                success: true,
                message: 'Inquiry submitted successfully. Our team will contact you soon.',
                data: inquiry
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/inquiries
     * Protected dashboard endpoint: list inquiries with pagination, searching, and filtering
     */
    async listInquiries(req, res, next) {
        try {
            const { page, limit, search, status, assigned_to_user_id } = req.query;

            const result = await this.inquiryService.listInquiries({
                page,
                limit,
                search,
                status,
                assigned_to_user_id
            });

            return res.status(200).json({
                success: true,
                data: result.inquiries,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/inquiries/:id
     * Protected dashboard endpoint: retrieve complete inquiry details
     */
    async getInquiryById(req, res, next) {
        try {
            const { id } = req.params;
            const inquiry = await this.inquiryService.getInquiryById(id);

            return res.status(200).json({
                success: true,
                data: inquiry
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/inquiries/:id/status
     * Protected dashboard endpoint: update inquiry status and assign/record staff member
     */
    async updateInquiryStatus(req, res, next) {
        try {
            const { id } = req.params;
            // Always obtain authenticated staff ID from session (never client body)
            const staffUserId = req.user ? req.user.user_id : null;

            const updated = await this.inquiryService.updateInquiryStatus(id, req.body, staffUserId);

            return res.status(200).json({
                success: true,
                message: 'Inquiry status updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }
}

const defaultInquiryController = new InquiryController();

module.exports = defaultInquiryController;
module.exports.InquiryController = InquiryController;
