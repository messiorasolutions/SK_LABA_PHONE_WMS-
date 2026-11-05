const crypto = require('crypto');
const AppError = require('../utils/customError');

function getOriginFromHeader(headerValue) {
    if (!headerValue) return null;
    try {
        const url = new URL(headerValue);
        return `${url.protocol}//${url.host}`;
    } catch {
        return null;
    }
}

function createCsrfMiddleware() {
    const rawAllowed = process.env.ALLOWED_ORIGINS || 'https://admin.sklabaphone.com,https://sklabaphone.com,http://localhost:5173,http://localhost:3000';
    const allowedOrigins = new Set(
        rawAllowed.split(',').map((o) => o.trim().toLowerCase()).filter(Boolean)
    );

    function csrfProtection(req, res, next) {
        // Safe read-only HTTP methods are exempt from CSRF checks
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return next();
        }

        // Exempt public login route from CSRF token verification (session does not yet exist),
        // but still validate origin / referer if provided
        const isLoginRoute = req.originalUrl.includes('/api/auth/login');

        // 1. Origin / Referer Validation (for non-test or when headers are present)
        const requestOrigin = getOriginFromHeader(req.headers.origin) || getOriginFromHeader(req.headers.referer);
        if (requestOrigin) {
            const isAllowed = allowedOrigins.has(requestOrigin.toLowerCase())
                || (process.env.NODE_ENV !== 'production' && (requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')));

            if (!isAllowed) {
                return next(new AppError(`Cross-Origin Request Blocked: Origin '${requestOrigin}' is not allowed.`, 403));
            }
        }

        if (isLoginRoute) {
            return next();
        }

        // 2. CSRF Token verification for authenticated state-changing requests
        if (req.session && req.session.userId) {
            const clientToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
            const sessionToken = req.session.csrfToken;

            if (!sessionToken || !clientToken || clientToken !== sessionToken) {
                return next(new AppError('Forbidden: Invalid or missing CSRF token.', 403));
            }
        }

        next();
    }

    function ensureCsrfToken(req) {
        if (!req.session) return null;
        if (!req.session.csrfToken) {
            req.session.csrfToken = crypto.randomBytes(32).toString('hex');
        }
        return req.session.csrfToken;
    }

    return {
        csrfProtection,
        ensureCsrfToken,
        allowedOrigins
    };
}

const defaultCsrf = createCsrfMiddleware();

module.exports = defaultCsrf;
module.exports.createCsrfMiddleware = createCsrfMiddleware;
