require('dotenv').config({ path: require('path').resolve(__dirname, '../../../backend/.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const TABLES = [
    'brands',
    'storage_options',
    'specifications',
    'installment_plans',
    'phones',
    'offers',
    'dashboard_users',
    'sessions',
    'password_reset_tokens',
    'inquiries',
    'reservations',
    'sell_requests',
    'back_in_stock_requests',
    'customer_reviews'
];

async function exportDatabase() {
    console.log('🔄 Connecting to Aiven MySQL...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 11302,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });
        console.log(' Connected to Aiven MySQL!');

        let sqlOutput = `-- SK LABA PHONE Database Export for cPanel\n`;
        sqlOutput += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

        for (const table of TABLES) {
            try {
                // Get CREATE TABLE
                const [createRows] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
                if (createRows.length > 0) {
                    const createTableSql = createRows[0]['Create Table'];
                    sqlOutput += `-- Table structure for \`${table}\`\n`;
                    sqlOutput += `DROP TABLE IF EXISTS \`${table}\`;\n`;
                    sqlOutput += `${createTableSql};\n\n`;

                    // Get Data
                    const [dataRows] = await connection.query(`SELECT * FROM \`${table}\``);
                    if (dataRows.length > 0) {
                        sqlOutput += `-- Dumping data for table \`${table}\` (${dataRows.length} rows)\n`;
                        for (const row of dataRows) {
                            const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
                            const values = Object.values(row).map(val => {
                                if (val === null || val === undefined) return 'NULL';
                                if (typeof val === 'number') return val;
                                if (typeof val === 'boolean') return val ? 1 : 0;
                                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                                if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
                                return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
                            }).join(', ');

                            sqlOutput += `INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`;
                        }
                        sqlOutput += `\n`;
                    }
                    console.log(` Exported table: ${table} (${dataRows.length} rows)`);
                }
            } catch (tableErr) {
                console.warn(`⚠️ Note on table ${table}:`, tableErr.message);
            }
        }

        sqlOutput += `SET FOREIGN_KEY_CHECKS = 1;\n`;

        const outputPath = path.resolve(__dirname, '../../../cpanel_database.sql');
        fs.writeFileSync(outputPath, sqlOutput, 'utf-8');
        console.log(`\n🎉 Success! Database exported to: ${outputPath}`);
        console.log(`You can now import "cpanel_database.sql" into cPanel phpMyAdmin!`);
    } catch (err) {
        console.error('❌ Export failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

exportDatabase();

