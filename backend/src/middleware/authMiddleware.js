const defaultRepository = require('../repositories/dashboardUserRepository');
const AppError = require('../utils/customError');

/**
 * Creates authentication and authorization middleware instances with injected repository.
 */
function createAuthMiddleware(userRepository = defaultRepository) {
    /**
     * Authenticate session and attach active user to req.user
     */
    async function authenticate(req, res, next) {
        try {
            if (!req.session || !req.session.userId) {
                return next(new AppError('Unauthorized: Please log in to access this resource.', 401));
            }

            const user = await userRepository.findById(req.session.userId);

            if (!user) {
                // Destroy stale session
                req.session.destroy(() => {});
                return next(new AppError('Unauthorized: User account no longer exists.', 401));
            }

            if (!user.is_active) {
                // Destroy session for deactivated user
                req.session.destroy(() => {});
                return next(new AppError('Unauthorized: Account is inactive. Please contact an administrator.', 401));
            }

            // Attach safe user profile to request
            req.user = {
                user_id: user.user_id,
                display_name: user.display_name,
                email: user.email,
                role: user.role,
                last_login_at: user.last_login_at,
                created_at: user.created_at,
                updated_at: user.updated_at
            };

            next();
        } catch (error) {
            next(error);
        }
    }

    /**
     * Restrict route access to specified roles
     * @param  {...string} allowedRoles
     */
    function requireRole(...allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                return next(new AppError('Unauthorized: Authentication required.', 401));
            }

            if (!allowedRoles.includes(req.user.role)) {
                return next(new AppError('Access forbidden: Insufficient permissions.', 403));
            }

            next();
        };
    }

    const requireAdmin = requireRole('ADMIN');
    const requireStaffOrAdmin = requireRole('ADMIN', 'STAFF');

    return {
        authenticate,
        requireRole,
        requireAdmin,
        requireStaffOrAdmin
    };
}

const defaultMiddleware = createAuthMiddleware(defaultRepository);

module.exports = defaultMiddleware;
module.exports.createAuthMiddleware = createAuthMiddleware;
