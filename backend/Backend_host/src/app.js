const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

// Global unhandled error catchers to prevent process exits on background tasks
if (!process.__error_handlers_registered) {
    process.__error_handlers_registered = true;
    process.on('uncaughtException', (err) => {
        console.error('UNCAUGHT EXCEPTION (app):', err.message);
    });
    process.on('unhandledRejection', (reason) => {
        console.error('UNHANDLED REJECTION (app):', reason && reason.message ? reason.message : reason);
    });
}

const express = require('express');
const cors = require('cors');
const createSessionMiddleware = require('./config/session');
const { csrfProtection } = require('./middleware/csrfMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const brandRoutes = require('./routes/brandRoutes');
const storageOptionRoutes = require('./routes/storageOptionRoutes');
const specificationRoutes = require('./routes/specificationRoutes');
const phoneRoutes = require('./routes/phoneRoutes');
const installmentPlanRoutes = require('./routes/installmentPlanRoutes');
const offerRoutes = require('./routes/offerRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const sellRequestRoutes = require('./routes/sellRequestRoutes');
const backInStockRequestRoutes = require('./routes/backInStockRequestRoutes');
const customerReviewRoutes = require('./routes/customerReviewRoutes');
const adminReviewRoutes = require('./routes/adminReviewRoutes');
const giveawayRoutes = require('./routes/giveawayRoutes');
const shopInfoRoutes = require('./routes/shopInfoRoutes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/customError');

const app = express();

// 1. CORS Configuration with explicit allowed origins & credentials
const defaultOrigins = [
    'https://admin.sklabaphone.com',
    'https://sklabaphone.com',
    'https://www.sklabaphone.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
];

const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
const customOrigins = rawAllowedOrigins
    .split(',')
    .map((origin) => origin.trim().toLowerCase())
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...customOrigins]));

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const lowerOrigin = origin.toLowerCase();
        const isAllowed = allowedOrigins.includes(lowerOrigin)
            || lowerOrigin.includes('localhost')
            || lowerOrigin.includes('127.0.0.1')
            || lowerOrigin.endsWith('.sklabaphone.com')
            || lowerOrigin.endsWith('sklabaphone.com');

        if (isAllowed) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// 2. Body Parsing Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Fast Health & Diagnostic Endpoints (Bypasses Session & CSRF so they never time out)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database Diagnostic Check Endpoint - Tests connection and reports status within 3 seconds
app.get('/api/test-db', async (req, res) => {
    const mysql = require('mysql2/promise');
    const results = {};
    const hostsToTry = [
        process.env.DB_HOST || '127.0.0.1',
        '127.0.0.1',
        'localhost'
    ];
    const uniqueHosts = Array.from(new Set(hostsToTry));

    for (const host of uniqueHosts) {
        let testPool = null;
        try {
            testPool = mysql.createPool({
                host,
                port: Number(process.env.DB_PORT) || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                connectTimeout: 3000,
                ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
            });
            const [rows] = await Promise.race([
                testPool.query('SELECT 1 as test'),
                new Promise((_, r) => setTimeout(() => r(new Error('Connection timed out after 3000ms')), 3000))
            ]);
            results[host] = { success: true, message: 'Connected successfully', result: rows };
        } catch (e) {
            results[host] = { success: false, error: e.message, code: e.code || 'TIMEOUT' };
        } finally {
            if (testPool) {
                testPool.end().catch(() => {});
            }
        }
    }

    const anySuccess = Object.values(results).some(r => r.success);
    return res.status(anySuccess ? 200 : 500).json({
        status: anySuccess ? 'DATABASE_OK' : 'DATABASE_FAILED',
        env_read: {
            DB_HOST: process.env.DB_HOST || 'MISSING',
            DB_PORT: process.env.DB_PORT || '3306',
            DB_USER: process.env.DB_USER || 'MISSING',
            DB_NAME: process.env.DB_NAME || 'MISSING',
            DB_SSL: process.env.DB_SSL || 'false'
        },
        connection_attempts: results,
        advice: anySuccess
            ? 'Database is reachable! Use the successful host in DB_HOST.'
            : 'Check user credentials and ensure DB_USER has ALL PRIVILEGES on DB_NAME in cPanel -> MySQL Databases.'
    });
});

// 4. Session & CSRF Security Middlewares
const { sessionMiddleware } = createSessionMiddleware();

// Optimize: Skip session store lookups for public storefront GET requests to ensure instant page load
app.use((req, res, next) => {
    const p = req.path || '';
    if (
        req.method === 'GET' &&
        !p.startsWith('/api/auth') &&
        !p.startsWith('/api/users') &&
        !p.startsWith('/api/admin')
    ) {
        return next();
    }
    return sessionMiddleware(req, res, next);
});

app.use(csrfProtection);

// Outbound IP Diagnostic Endpoint - shows the real public IP of this server
app.get('/api/my-ip', (req, res) => {
    const https = require('https');
    https.get('https://api.ipify.org?format=json', (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
            try {
                const json = JSON.parse(data);
                res.json({
                    server_outbound_ip: json.ip,
                    message: 'Add this IP to your Aiven MySQL IP Allow List'
                });
            } catch (e) {
                res.json({ raw: data });
            }
        });
    }).on('error', (err) => {
        res.status(500).json({ error: err.message });
    });
});

// 5. Swagger UI Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');

const swaggerSpec = { ...swaggerDocument };
if (process.env.HOSTED_URL || process.env.BASE_URL) {
    const hostedUrl = process.env.HOSTED_URL || process.env.BASE_URL;
    swaggerSpec.servers = [
        { url: hostedUrl, description: 'Hosted Server' },
        { url: '/', description: 'Current Server (Relative)' }
    ];
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
});

// 6. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/storage-options', storageOptionRoutes);
app.use('/api/specifications', specificationRoutes);
app.use('/api/phones', phoneRoutes);
app.use('/api/installment-plans', installmentPlanRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/sell-requests', sellRequestRoutes);
app.use('/api/sell-phone-requests', sellRequestRoutes);
app.use('/api/back-in-stock-requests', backInStockRequestRoutes);
app.use('/api/reviews', customerReviewRoutes);
app.use('/api/admin/reviews', adminReviewRoutes);
app.use('/api/giveaways', giveawayRoutes);
app.use('/api/shop-info', shopInfoRoutes);

// 7. 404 Handler for undefined routes
app.use((req, res, next) => {
    next(new AppError(`Cannot find route ${req.method} ${req.originalUrl}`, 404));
});

// 8. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
