// ====================================================================
// CPANEL LITESPEED / PASSENGER ENTRY POINT (app.js)
// ====================================================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

// Global unhandled error catchers to prevent LiteSpeed 503 process crashes
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// Listen for incoming requests (works for Passenger socket & standalone reverse proxy)
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
