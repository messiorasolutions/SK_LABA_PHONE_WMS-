const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 11302,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});


async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(' Connected to Aiven MySQL database successfully!');
        connection.release();
    } catch (error) {
        console.error(' Database connection failed:', error.message);
    }
}

testConnection();

module.exports = pool;
