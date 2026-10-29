const defaultUserService = require('../services/userService');

class UserController {
    constructor(userService = defaultUserService) {
        this.userService = userService;
    }

    /**
     * GET /api/users
     * Retrieve paginated list of users with optional filtering and search
     */
    async listUsers(req, res, next) {
        try {
            const { page, limit, search, role, is_active } = req.query;

            const result = await this.userService.listUsers({
                page,
                limit,
                search,
                role,
                is_active
            });

            return res.status(200).json({
                success: true,
                data: result.users,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/users/:id
     * Retrieve safe user details by ID
     */
    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await this.userService.getUserById(id);

            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/users
     * Create a new staff or admin user
     */
    async createUser(req, res, next) {
        try {
            const { display_name, email, password, role, is_active } = req.body;

            const user = await this.userService.createUser({
                display_name,
                email,
                password,
                role,
                is_active
            });

            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/users/:id
     * Update permitted fields of a user
     */
    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const currentUserId = req.user ? req.user.user_id : null;

            const user = await this.userService.updateUser(id, req.body, currentUserId);

            return res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/users/:id/status
     * Activate or deactivate a user account
     */
    async updateUserStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            const currentUserId = req.user ? req.user.user_id : null;

            const user = await this.userService.updateUserStatus(id, is_active, currentUserId);

            return res.status(200).json({
                success: true,
                message: `User account ${user.is_active ? 'activated' : 'deactivated'} successfully`,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
module.exports.UserController = UserController;
