const express = require('express');
const defaultUserController = require('../controllers/userController');
const defaultAuthMiddleware = require('../middleware/authMiddleware');
const {
    validateUserIdParam,
    validateListUsers,
    validateCreateUser,
    validateUpdateUser,
    validateUpdateUserStatus
} = require('../validations/userValidation');

function createUsersRouter({
    userController = defaultUserController,
    authMiddleware = defaultAuthMiddleware
} = {}) {
    const router = express.Router();

    // All endpoints in this router require an authenticated ADMIN session
    router.use(authMiddleware.authenticate, authMiddleware.requireAdmin);

    // 1. GET /api/users - List users with pagination and search/filters
    router.get('/', validateListUsers, (req, res, next) => {
        userController.listUsers(req, res, next);
    });

    // 2. GET /api/users/:id - Get safe user details by ID
    router.get('/:id', validateUserIdParam, (req, res, next) => {
        userController.getUserById(req, res, next);
    });

    // 3. POST /api/users - Create new staff/admin user
    router.post('/', validateCreateUser, (req, res, next) => {
        userController.createUser(req, res, next);
    });

    // 4. PATCH /api/users/:id - Update permitted user profile fields & role
    router.patch('/:id', validateUserIdParam, validateUpdateUser, (req, res, next) => {
        userController.updateUser(req, res, next);
    });

    // 5. PATCH /api/users/:id/status - Activate or deactivate user account
    router.patch('/:id/status', validateUserIdParam, validateUpdateUserStatus, (req, res, next) => {
        userController.updateUserStatus(req, res, next);
    });

    return router;
}

const defaultRouter = createUsersRouter();

module.exports = defaultRouter;
module.exports.createUsersRouter = createUsersRouter;
