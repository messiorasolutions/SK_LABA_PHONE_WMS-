const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

function buildSslConfig() {
    if (process.env.DB_SSL === 'false') {
        return undefined;
    }

    const sslConfig = {};

    if (process.env.DB_SSL_CA_PATH && fs.existsSync(process.env.DB_SSL_CA_PATH)) {
        sslConfig.ca = fs.readFileSync(process.env.DB_SSL_CA_PATH, 'utf-8');
        sslConfig.rejectUnauthorized = true;
    } else if (process.env.DB_SSL_CA) {
        sslConfig.ca = process.env.DB_SSL_CA;
        sslConfig.rejectUnauthorized = true;
    } else if (process.env.NODE_ENV === 'production') {
        // Enforce strict TLS certificate verification in production
        sslConfig.rejectUnauthorized = true;
    } else {
        // For local development without downloaded CA certificates:
        // Controlled via DB_SSL_REJECT_UNAUTHORIZED (defaults to false only in non-production)
        const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
        sslConfig.rejectUnauthorized = rejectUnauthorized;
    }

    return sslConfig;
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 11302,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    ssl: buildSslConfig()
});

async function testConnection() {
    if (process.env.NODE_ENV === 'test') {
        return;
    }
    try {
        const connection = await pool.getConnection();
        console.log(' Connected to MySQL database successfully!');
        connection.release();
    } catch (error) {
        console.error(' Database connection failed:', error.message);
    }
}

testConnection();

module.exports = pool;
