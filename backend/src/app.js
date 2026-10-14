const express = require('express');
const cors = require('cors');
const brandRoutes = require('./routes/brandRoutes');
const storageOptionRoutes = require('./routes/storageOptionRoutes');
const specificationRoutes = require('./routes/specificationRoutes');
const phoneRoutes = require('./routes/phoneRoutes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/customError');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Swagger UI Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');

// Support optional HOSTED_URL or BASE_URL from .env
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

// API Routes
app.use('/api/brands', brandRoutes);
app.use('/api/storage-options', storageOptionRoutes);
app.use('/api/specifications', specificationRoutes);
app.use('/api/phones', phoneRoutes);

// 404 Handler for undefined routes
app.use((req, res, next) => {
    next(new AppError(`Cannot find route ${req.method} ${req.originalUrl}`, 404));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
