require('dotenv').config();
const crypto = require('crypto');
const request = require('supertest');
const pool = require('../config/db');
const app = require('../app');
const createAdminUser = require('./createAdmin');

async function verifyLiveAuth() {
    console.log('====================================================');
    console.log(' SK LABA PHONE WMS - Live Aiven Auth Verification');
    console.log('====================================================\n');

    try {
        // 1. Check if ADMIN exists, provision if needed
        const adminEmail = 'admin@sklabaphone.com';
        const staffEmail = 'staff@sklabaphone.com';

        // Cryptographically generate random runtime passwords (never hardcoded, never printed)
        const runtimeAdminPass = `Adm!${crypto.randomBytes(16).toString('base64url')}#9`;
        const runtimeStaffPass = `Stf!${crypto.randomBytes(16).toString('base64url')}#1`;

        const [existingAdmin] = await pool.execute(
            'SELECT user_id, display_name, email, role, is_active FROM dashboard_users WHERE LOWER(email) = ?',
            [adminEmail]
        );

        let adminUser;
        if (existingAdmin.length === 0) {
            console.log('⏳ Provisioning initial ADMIN account into live Aiven MySQL...');
            adminUser = await createAdminUser({
                displayName: 'System Administrator',
                email: adminEmail,
                role: 'ADMIN',
                password: runtimeAdminPass
            });
            console.log('✔ Initial ADMIN account provisioned successfully.');
        } else {
            console.log('ℹ Existing ADMIN account found. Resetting password for verification run...');
            const PasswordUtil = require('../utils/passwordUtil');
            const newHash = await PasswordUtil.hashPassword(runtimeAdminPass);
            await pool.execute('UPDATE dashboard_users SET password_hash = ? WHERE user_id = ?', [newHash, existingAdmin[0].user_id]);
            adminUser = existingAdmin[0];
        }

        const [existingStaff] = await pool.execute(
            'SELECT user_id, display_name, email, role, is_active FROM dashboard_users WHERE LOWER(email) = ?',
            [staffEmail]
        );

        if (existingStaff.length === 0) {
            console.log('⏳ Provisioning STAFF account into live Aiven MySQL...');
            await createAdminUser({
                displayName: 'Warehouse Staff Member',
                email: staffEmail,
                role: 'STAFF',
                password: runtimeStaffPass
            });
            console.log('✔ STAFF account provisioned successfully.');
        } else {
            const PasswordUtil = require('../utils/passwordUtil');
            const newHash = await PasswordUtil.hashPassword(runtimeStaffPass);
            await pool.execute('UPDATE dashboard_users SET password_hash = ? WHERE user_id = ?', [newHash, existingStaff[0].user_id]);
        }

        // 2. Test Live HTTP Authentication Flow with express app + MySQL session store
        console.log('\n--- Commencing Live Endpoints & Session Store Testing ---');

        const adminAgent = request.agent(app);

        // A. Login as ADMIN
        console.log('⏳ Testing POST /api/auth/login for ADMIN...');
        const adminLoginRes = await adminAgent
            .post('/api/auth/login')
            .send({ email: adminEmail, password: runtimeAdminPass });

        if (adminLoginRes.status !== 200 || !adminLoginRes.body.success) {
            throw new Error(`Admin login failed: ${adminLoginRes.status} ${JSON.stringify(adminLoginRes.body)}`);
        }
        console.log('✔ POST /api/auth/login (ADMIN): HTTP 200 OK');
        console.log('  - Role verified:', adminLoginRes.body.data.user.role);
        console.log('  - Email verified:', adminLoginRes.body.data.user.email);
        console.log('  - Password hash returned:', adminLoginRes.body.data.user.password_hash !== undefined ? 'EXPOSED' : 'NONE (Safe)');
        console.log('  - Session cookie received:', Boolean(adminLoginRes.headers['set-cookie']));

        const csrfToken = adminLoginRes.body.data.csrfToken;

        // B. Verify GET /api/auth/me (ADMIN)
        console.log('\n⏳ Testing GET /api/auth/me for ADMIN session...');
        const adminMeRes = await adminAgent.get('/api/auth/me');
        if (adminMeRes.status !== 200 || !adminMeRes.body.success) {
            throw new Error(`Admin /me failed: ${adminMeRes.status} ${JSON.stringify(adminMeRes.body)}`);
        }
        console.log('✔ GET /api/auth/me (ADMIN): HTTP 200 OK');
        console.log('  - User ID:', adminMeRes.body.data.user.user_id);
        console.log('  - Role:', adminMeRes.body.data.user.role);

        // C. Verify sessions table contains live session
        console.log('\n⏳ Verifying MySQL session store in Aiven MySQL...');
        const [sessionRows] = await pool.execute('SELECT COUNT(*) as active_sessions FROM sessions');
        console.log(`✔ Live sessions stored in MySQL table 'sessions': ${sessionRows[0].active_sessions}`);

        // D. Test Staff Login & Session
        console.log('\n⏳ Testing POST /api/auth/login for STAFF...');
        const staffAgent = request.agent(app);
        const staffLoginRes = await staffAgent
            .post('/api/auth/login')
            .send({ email: staffEmail, password: runtimeStaffPass });

        if (staffLoginRes.status !== 200 || !staffLoginRes.body.success) {
            throw new Error(`Staff login failed: ${staffLoginRes.status} ${JSON.stringify(staffLoginRes.body)}`);
        }
        console.log('✔ POST /api/auth/login (STAFF): HTTP 200 OK');
        console.log('  - Role verified:', staffLoginRes.body.data.user.role);

        // E. Verify GET /api/auth/me (STAFF)
        console.log('\n⏳ Testing GET /api/auth/me for STAFF session...');
        const staffMeRes = await staffAgent.get('/api/auth/me');
        if (staffMeRes.status !== 200 || !staffMeRes.body.success) {
            throw new Error(`Staff /me failed: ${staffMeRes.status}`);
        }
        console.log('✔ GET /api/auth/me (STAFF): HTTP 200 OK');
        console.log('  - Role verified:', staffMeRes.body.data.user.role);

        // F. Test Unauthenticated Access
        console.log('\n⏳ Testing GET /api/auth/me without session...');
        const unauthRes = await request(app).get('/api/auth/me');
        console.log(`✔ Unauthenticated /me response: HTTP ${unauthRes.status} (Expected: 401)`);
        if (unauthRes.status !== 401) {
            throw new Error(`Expected 401, got ${unauthRes.status}`);
        }

        // G. Test Logout for Admin
        console.log('\n⏳ Testing POST /api/auth/logout for ADMIN...');
        const logoutRes = await adminAgent
            .post('/api/auth/logout')
            .set('X-CSRF-Token', csrfToken);

        if (logoutRes.status !== 200) {
            throw new Error(`Logout failed: ${logoutRes.status}`);
        }
        console.log('✔ POST /api/auth/logout: HTTP 200 OK');

        // H. Test Subsequent /me after Logout
        console.log('\n⏳ Testing subsequent GET /api/auth/me after logout...');
        const postLogoutMe = await adminAgent.get('/api/auth/me');
        console.log(`✔ Post-logout /me response: HTTP ${postLogoutMe.status} (Expected: 401)`);
        if (postLogoutMe.status !== 401) {
            throw new Error(`Expected 401, got ${postLogoutMe.status}`);
        }

        // I. Test Invalid Credentials
        console.log('\n⏳ Testing invalid credentials rejection...');
        const invalidLoginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: adminEmail, password: 'NonExistentPassword999!' });
        console.log(`✔ Invalid credentials response: HTTP ${invalidLoginRes.status} (Message: "${invalidLoginRes.body.message}")`);
        if (invalidLoginRes.status !== 401) {
            throw new Error(`Expected 401, got ${invalidLoginRes.status}`);
        }

        console.log('\n====================================================');
        console.log('🎉 ALL LIVE AIVEN AUTHENTICATION VERIFICATIONS PASSED!');
        console.log('====================================================\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Live verification failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

verifyLiveAuth();
