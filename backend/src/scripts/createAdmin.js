require('dotenv').config();
const readline = require('readline');
const pool = require('../config/db');
const PasswordUtil = require('../utils/passwordUtil');

function prompt(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

function promptPassword(question) {
    return new Promise((resolve) => {
        process.stdout.write(question);
        const stdin = process.stdin;
        const wasRaw = stdin.isRaw;
        let password = '';

        if (stdin.isTTY) {
            stdin.setRawMode(true);
            stdin.resume();
            stdin.setEncoding('utf8');

            const onData = (char) => {
                // Enter or Return
                if (char === '\n' || char === '\r' || char === '\u0004') {
                    stdin.setRawMode(wasRaw);
                    stdin.removeListener('data', onData);
                    process.stdout.write('\n');
                    resolve(password);
                } else if (char === '\u0003') { // Ctrl+C
                    process.exit(1);
                } else if (char === '\u007f' || char === '\b') { // Backspace
                    if (password.length > 0) {
                        password = password.slice(0, -1);
                        process.stdout.write('\b \b');
                    }
                } else {
                    password += char;
                    process.stdout.write('*');
                }
            };

            stdin.on('data', onData);
        } else {
            // Non-interactive / pipe mode fallback
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question('', (ans) => {
                rl.close();
                resolve(ans.trim());
            });
        }
    });
}

async function createAdminUser(options = {}) {
    console.log('====================================================');
    console.log(' SK LABA PHONE WMS - Dashboard User Provisioning CLI');
    console.log('====================================================\n');

    let { displayName, email, role, password } = options;
    let rl;

    try {
        if (!displayName || !email || !role || !password) {
            rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        }

        // 1. Display Name
        while (!displayName) {
            displayName = await prompt(rl, 'Enter Display Name (e.g. Master Admin): ');
            if (!displayName) {
                console.log('❌ Display name cannot be empty.');
            }
        }

        // 2. Email Address
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        while (!email) {
            const rawEmail = await prompt(rl, 'Enter Email Address: ');
            if (!rawEmail || !emailRegex.test(rawEmail)) {
                console.log('❌ Please enter a valid email address.');
            } else {
                email = rawEmail.toLowerCase();
            }
        }
        email = email.trim().toLowerCase();
        if (!emailRegex.test(email)) {
            throw new Error(`Invalid email address: ${email}`);
        }

        // 3. Role
        while (!role) {
            const rawRole = (await prompt(rl, 'Enter Role (ADMIN or STAFF) [Default: ADMIN]: ')).toUpperCase() || 'ADMIN';
            if (rawRole === 'ADMIN' || rawRole === 'STAFF') {
                role = rawRole;
            } else {
                console.log('❌ Invalid role. Must be ADMIN or STAFF.');
            }
        }
        role = role.toUpperCase();
        if (role !== 'ADMIN' && role !== 'STAFF') {
            throw new Error(`Invalid role: ${role}. Must be ADMIN or STAFF.`);
        }

        if (rl) {
            rl.close();
            rl = null;
        }

        // 4. Password (Masked if interactive)
        while (!password) {
            const pass = await promptPassword('Enter Password (min 8 characters): ');
            if (!pass || pass.length < 8) {
                console.log('❌ Password must be at least 8 characters long.');
                continue;
            }

            const confirmPass = await promptPassword('Confirm Password: ');
            if (pass !== confirmPass) {
                console.log('❌ Passwords do not match. Please try again.');
                continue;
            }

            password = pass;
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long.');
        }

        console.log('\n⏳ Checking existing users and hashing password...');

        // Verify email uniqueness
        const [existing] = await pool.execute(
            'SELECT user_id FROM dashboard_users WHERE LOWER(email) = LOWER(?)',
            [email]
        );

        if (existing.length > 0) {
            console.error(`\n❌ Error: A dashboard user with email "${email}" already exists.`);
            process.exitCode = 1;
            return null;
        }

        // Hash with Argon2id
        const passwordHash = await PasswordUtil.hashPassword(password);

        // Insert new dashboard user
        const [insertResult] = await pool.execute(
            `INSERT INTO dashboard_users (display_name, email, password_hash, role, is_active)
             VALUES (?, ?, ?, ?, TRUE)`,
            [displayName.trim(), email, passwordHash, role]
        );

        console.log('\n====================================================');
        console.log('✅ Dashboard user provisioned successfully!');
        console.log(`   User ID:      ${insertResult.insertId}`);
        console.log(`   Display Name: ${displayName}`);
        console.log(`   Email:        ${email}`);
        console.log(`   Role:         ${role}`);
        console.log(`   Active:       true`);
        console.log('====================================================\n');

        return {
            user_id: insertResult.insertId,
            display_name: displayName,
            email,
            role,
            is_active: true
        };
    } catch (error) {
        console.error('\n❌ Provisioning failed:', error.message);
        process.exitCode = 1;
        throw error;
    } finally {
        if (rl) rl.close();
        // Only end pool if run as standalone script
        if (require.main === module) {
            await pool.end();
        }
    }
}

if (require.main === module) {
    createAdminUser();
}

module.exports = createAdminUser;
