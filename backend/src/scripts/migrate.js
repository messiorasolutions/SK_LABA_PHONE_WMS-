require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigrations() {
    console.log('🚀 Running database migrations...');
    const migrationsDir = path.resolve(__dirname, '../../../database/migrations');

    if (!fs.existsSync(migrationsDir)) {
        console.error(`❌ Migrations directory not found: ${migrationsDir}`);
        process.exit(1);
    }

    const connection = await pool.getConnection();

    try {
        // Ensure schema_migrations table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // Fetch already executed migrations
        const [appliedRows] = await connection.query('SELECT migration_name FROM schema_migrations');
        const appliedSet = new Set(appliedRows.map((row) => row.migration_name));

        const files = fs.readdirSync(migrationsDir)
            .filter((file) => file.endsWith('.sql'))
            .sort();

        let appliedCount = 0;

        for (const file of files) {
            if (appliedSet.has(file)) {
                console.log(`⏩ Skipping already applied migration: ${file}`);
                continue;
            }

            console.log(`⚙️  Applying migration: ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            // Split statements by semicolon where appropriate, or run multi-statement if enabled
            const statements = sql
                .split(/;\s*$/m)
                .map((stmt) => stmt.trim())
                .filter((stmt) => stmt.length > 0);

            for (const stmt of statements) {
                await connection.query(stmt);
            }

            await connection.query('INSERT INTO schema_migrations (migration_name) VALUES (?)', [file]);
            console.log(`✅ Applied migration: ${file}`);
            appliedCount++;
        }

        console.log(`🎉 Migrations complete. Total newly applied: ${appliedCount}`);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        connection.release();
        await pool.end();
    }
}

if (require.main === module) {
    runMigrations();
}

module.exports = runMigrations;
