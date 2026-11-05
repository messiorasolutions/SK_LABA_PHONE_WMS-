require('dotenv').config();
const readline = require('readline');
const pool = require('../config/db');
const PasswordUtil = require('../utils/passwordUtil');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(q) {
    return new Promise(resolve => rl.question(q, resolve));
}

async function run() {
    console.log('--- Reset Admin Password Tool (Bcrypt) ---');
    try {
        const email = (await ask('Enter user email (e.g., admin@sklabaphone.com): ')).trim().toLowerCase();
        const newPassword = (await ask('Enter new password: ')).trim();

        if (!email || !newPassword) {
            console.error('Email and password cannot be empty.');
            process.exit(1);
        }

        const [rows] = await pool.query('SELECT user_id, email, display_name FROM dashboard_users WHERE email = ?', [email]);
        if (rows.length === 0) {
            console.error(`User with email "${email}" not found.`);
            process.exit(1);
        }

        const user = rows[0];
        const newHash = await PasswordUtil.hashPassword(newPassword);

        await pool.query('UPDATE dashboard_users SET password_hash = ? WHERE user_id = ?', [newHash, user.user_id]);
        console.log(`Success! Password for ${user.email} (${user.display_name}) has been reset with bcrypt.`);
    } catch (err) {
        console.error('Error resetting password:', err.message);
    } finally {
        await pool.end();
        rl.close();
    }
}

run();

