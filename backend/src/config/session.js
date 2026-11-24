const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./db');

function createSessionMiddleware() {
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    const secret = process.env.SESSION_SECRET || (isProduction ? null : 'sk-laba-phone-wms-dev-session-secret-key-32chars');

    if (isProduction && (!secret || secret.length < 32)) {
        throw new Error('FATAL: SESSION_SECRET must be defined and at least 32 characters in production.');
    }

    let store;
    if (isTest || process.env.SESSION_STORE === 'memory') {
        store = new session.MemoryStore();
    } else {
        try {
            store = new MySQLStore({
                clearExpired: false,
                checkExpirationInterval: 0, // Disabled internal timer to avoid uncaught promise rejections
                expiration: Number(process.env.SESSION_MAX_AGE_MS) || (24 * 60 * 60 * 1000), // 24 hours
                createDatabaseTable: false, // Sessions table is pre-created by SQL schema, avoid blocking DDL queries
                schema: {
                    tableName: 'sessions',
                    columnNames: {
                        session_id: 'session_id',
                        expires: 'expires',
                        data: 'data'
                    }
                }
            }, pool);

            store.on('error', (err) => {
                console.error('Session store error (non-fatal):', err.message);
            });
        } catch (storeErr) {
            console.error('MySQLStore initialization error, fallback to MemoryStore:', storeErr.message);
            store = new session.MemoryStore();
        }
    }

    const cookieName = process.env.SESSION_COOKIE_NAME || 'sk_laba_sid';
    const sameSite = process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax');
    // If sameSite is 'none', secure MUST be true, otherwise modern browsers reject the Set-Cookie header entirely!
    const isSecure = isProduction || sameSite === 'none' || (process.env.COOKIE_SECURE === 'true');

    const cookieOptions = {
        httpOnly: true,
        secure: isSecure,
        sameSite: sameSite,
        maxAge: Number(process.env.SESSION_MAX_AGE_MS) || (24 * 60 * 60 * 1000), // 24 hours
        path: '/'
    };

    // In production or hosted domain, ensure domain is set to share cookies across subdomains (admin.sklabaphone.com & api.sklabaphone.com)
    const configuredDomain = process.env.COOKIE_DOMAIN;
    if (configuredDomain && !configuredDomain.includes('localhost')) {
        cookieOptions.domain = configuredDomain;
    } else if (isProduction) {
        cookieOptions.domain = '.sklabaphone.com';
    }

    const sessionMiddleware = session({
        name: cookieName,
        secret: secret || 'temporary-fallback-secret-for-testing',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        store,
        cookie: cookieOptions
    });

    return {
        sessionMiddleware,
        cookieName,
        cookieOptions,
        store,
        secret: secret || 'temporary-fallback-secret-for-testing'
    };
}

module.exports = createSessionMiddleware;
