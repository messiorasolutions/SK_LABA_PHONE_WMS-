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
const inquiryRoutes = require('./routes/inquiryRoutes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/customError');

const app = express();

// 1. CORS Configuration with explicit allowed origins & credentials
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || 'https://admin.sklabaphone.com,https://sklabaphone.com,http://localhost:5173,http://localhost:3000';
const allowedOrigins = rawAllowedOrigins
    .split(',')
    .map((origin) => origin.trim().toLowerCase())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const lowerOrigin = origin.toLowerCase();
        const isAllowed = allowedOrigins.includes(lowerOrigin)
            || (process.env.NODE_ENV !== 'production' && (lowerOrigin.includes('localhost') || lowerOrigin.includes('127.0.0.1')));

        if (isAllowed) {
            return callback(null, true);
        }
        return callback(new AppError(`Origin ${origin} not allowed by CORS`, 403));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}));

// 2. Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Session & CSRF Security Middlewares
const { sessionMiddleware } = createSessionMiddleware();
app.use(sessionMiddleware);
app.use(csrfProtection);

// 4. Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 5. Swagger UI Documentation
// Database Diagnostic Check Endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = require('./config/db');
        const [rows] = await pool.query('SELECT 1 as test');
        res.json({
            success: true,
            status: 'Database connected successfully',
            db_host: process.env.DB_HOST || 'MISSING',
            db_port: process.env.DB_PORT || 'MISSING',
            result: rows
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            status: 'Database connection failed',
            db_host: process.env.DB_HOST || 'MISSING',
            db_port: process.env.DB_PORT || 'MISSING',
            error_message: err.message,
            error_code: err.code
        });
    }
});

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

// Swagger UI Documentation
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
app.use('/api/inquiries', inquiryRoutes);

// 7. 404 Handler for undefined routes
app.use((req, res, next) => {
    next(new AppError(`Cannot find route ${req.method} ${req.originalUrl}`, 404));
});

// 8. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
