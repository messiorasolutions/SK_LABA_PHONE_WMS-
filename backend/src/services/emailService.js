const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();
const nodemailer = require('nodemailer');

class EmailService {
    constructor(transporter = null) {
        this.transporter = transporter;
        this.isConfigured = false;
        this.initTransporter();
    }

    initTransporter() {
        if (this.transporter) {
            this.isConfigured = true;
            return;
        }

        const host = process.env.SMTP_HOST;
        const port = Number(process.env.SMTP_PORT) || 587;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;

        if (!host || !user || !pass) {
            this.isConfigured = false;
            return;
        }

        try {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: { user, pass },
                tls: {
                    rejectUnauthorized: process.env.NODE_ENV === 'production'
                }
            });
            this.isConfigured = true;
        } catch (error) {
            console.error('Failed to initialize SMTP transporter:', error.message);
            this.isConfigured = false;
        }
    }

    /**
     * Send account verification email with temporary credentials
     * @param {Object} options
     * @param {string} options.to - Recipient email
     * @param {string} options.displayName - Recipient display name
     * @param {string} options.tempPassword - Temporary password assigned by admin
     * @param {string} options.verificationUrl - Verification link
     * @param {string} [options.role='STAFF'] - Assigned role
     * @returns {Promise<boolean>}
     */
    async sendVerificationEmail({ to, displayName, tempPassword, verificationUrl, role = 'STAFF' }) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('[EmailService] SMTP is not configured. Email will not be dispatched in this environment.');
            return false;
        }

        const sender = process.env.EMAIL_FROM || '"SK LABA PHONE" <no-reply@sklabaphone.com>';
        const recipientName = displayName || 'User';

        const subject = 'SK LABA PHONE — Verify Your Account & Temporary Credentials';
        const textContent = `Hello ${recipientName},\n\nAn account has been created for you on the SK LABA PHONE Warehouse Management System.\n\nAccount Details:\n• Email: ${to}\n• Temporary Password: ${tempPassword}\n• Role: ${role}\n\nTo activate your account, please verify your email and set a new password by clicking the link below:\n${verificationUrl}\n\nIf you have questions, please contact an administrator.\n\nBest regards,\nSK LABA PHONE Team`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>SK LABA PHONE — Account Verification</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
                                <!-- Brand Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #09090b 0%, #18181b 70%, #4c0519 100%); padding: 24px 30px; border-bottom: 2px solid #e11d48; text-align: left;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <span style="font-size: 19px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff; display: block;">SK LABA PHONE</span>
                                                    <span style="font-size: 10px; font-weight: 600; color: #fda4af; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 2px;">South Korea • Warehouse Management System</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Content Body -->
                                <tr>
                                    <td style="padding: 32px 30px; color: #27272a; line-height: 1.6; font-size: 14px;">
                                        <p style="margin: 0 0 16px 0; font-size: 16px; color: #09090b;">Hello <strong>${recipientName}</strong>,</p>
                                        <p style="margin: 0 0 20px 0; color: #52525b;">Your user account has been registered on the <strong>SK LABA PHONE</strong> dashboard. To get started and activate your account, please verify your credentials and configure your permanent password.</p>

                                        <!-- Credentials Card -->
                                        <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 4px solid #e11d48; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
                                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #71717a; display: block; margin-bottom: 12px;">Temporary Access Credentials</span>
                                            <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px;">
                                                <tr>
                                                    <td style="color: #71717a; width: 140px;">Account Email:</td>
                                                    <td style="font-weight: 600; color: #09090b; font-family: monospace;">${to}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #71717a;">Temporary Password:</td>
                                                    <td style="font-weight: 700; color: #9f1239; font-family: monospace; font-size: 14px;">${tempPassword}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #71717a;">Assigned Role:</td>
                                                    <td style="font-weight: 600; color: #09090b;">${role}</td>
                                                </tr>
                                            </table>
                                        </div>

                                        <!-- Action Button -->
                                        <div style="margin: 32px 0 24px 0; text-align: center;">
                                            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #09090b 0%, #18181b 60%, #4c0519 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 13px; display: inline-block; border: 1px solid #27272a; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">Verify Account & Set Password</a>
                                        </div>

                                        <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0 0 24px 0;">This verification link is secure and valid for 72 hours.</p>

                                        <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 24px 0;" />

                                        <p style="font-size: 11px; color: #a1a1aa; line-height: 1.5; margin: 0;">
                                            If the button above does not work, copy and paste this verification URL into your browser:<br />
                                            <a href="${verificationUrl}" style="color: #be123c; word-break: break-all;">${verificationUrl}</a>
                                        </p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #fafafa; padding: 16px 30px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #a1a1aa;">
                                        © ${new Date().getFullYear()} SK LABA PHONE. All rights reserved. • South Korea
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            await this.transporter.sendMail({
                from: sender,
                to,
                subject,
                text: textContent,
                html: htmlContent
            });
            return true;
        } catch (error) {
            console.error('[EmailService] SMTP verification delivery error:', error.message);
            return false;
        }
    }

    /**
     * Send account deactivated notification email
     * @param {Object} options
     * @param {string} options.to - Recipient email
     * @param {string} options.displayName - Recipient display name
     * @returns {Promise<boolean>}
     */
    async sendAccountDeactivatedEmail({ to, displayName }) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('[EmailService] SMTP is not configured. Email will not be dispatched in this environment.');
            return false;
        }

        const sender = process.env.EMAIL_FROM || '"SK LABA PHONE" <no-reply@sklabaphone.com>';
        const recipientName = displayName || 'User';

        const subject = 'SK LABA PHONE — Account Deactivated';
        const textContent = `Hello ${recipientName},\n\nYour account (${to}) has been deactivated. Contact admins for more details.\n\nThank you.\n\nBest regards,\nSK LABA PHONE Administration`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>SK LABA PHONE — Account Deactivated</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
                                <!-- Brand Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #09090b 0%, #18181b 70%, #4c0519 100%); padding: 24px 30px; border-bottom: 2px solid #e11d48; text-align: left;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <span style="font-size: 19px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff; display: block;">SK LABA PHONE</span>
                                                    <span style="font-size: 10px; font-weight: 600; color: #fda4af; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 2px;">South Korea • Warehouse Management System</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Content Body -->
                                <tr>
                                    <td style="padding: 32px 30px; color: #27272a; line-height: 1.6; font-size: 14px;">
                                        <p style="margin: 0 0 16px 0; font-size: 16px; color: #09090b;">Hello <strong>${recipientName}</strong>,</p>
                                        
                                        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
                                            <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 500;">
                                                Your account (<strong>${to}</strong>) has been deactivated.
                                            </p>
                                            <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 13px;">
                                                Contact admins for more details. Thank you.
                                            </p>
                                        </div>

                                        <p style="color: #52525b; font-size: 13px; margin: 24px 0 0 0;">
                                            If you believe this was done in error or require reactivation, please contact the system administrator immediately.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #fafafa; padding: 16px 30px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #a1a1aa;">
                                        © ${new Date().getFullYear()} SK LABA PHONE. All rights reserved. • South Korea
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            await this.transporter.sendMail({
                from: sender,
                to,
                subject,
                text: textContent,
                html: htmlContent
            });
            return true;
        } catch (error) {
            console.error('[EmailService] SMTP deactivation delivery error:', error.message);
            return false;
        }
    }

    /**
     * Send password reset email
     * @param {Object} options
     * @param {string} options.to - Recipient email
     * @param {string} options.resetUrl - Full password reset URL
     * @param {string} [options.displayName] - Recipient name
     * @returns {Promise<boolean>} True if delivered or safely queued, false otherwise
     */
    async sendPasswordResetEmail({ to, resetUrl, displayName }) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('[EmailService] SMTP is not configured. Email will not be dispatched in this environment.');
            return false;
        }

        const sender = process.env.EMAIL_FROM || '"SK LABA PHONE" <no-reply@sklabaphone.com>';
        const recipientName = displayName || 'User';

        const subject = 'SK LABA PHONE — Password Reset Request';
        const textContent = `Hello ${recipientName},\n\nWe received a request to reset your password for the SK LABA PHONE Dashboard.\n\nClick the link below or copy it into your browser to reset your password:\n${resetUrl}\n\nThis link will expire in 15 minutes. If you did not make this request, you can safely ignore this email.\n\nBest regards,\nSK LABA PHONE Security`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>SK LABA PHONE — Password Reset</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #09090b 0%, #18181b 70%, #4c0519 100%); padding: 24px 30px; border-bottom: 2px solid #e11d48; text-align: left;">
                                        <span style="font-size: 19px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff; display: block;">SK LABA PHONE</span>
                                        <span style="font-size: 10px; font-weight: 600; color: #fda4af; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 2px;">South Korea • Warehouse Management System</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 32px 30px; color: #27272a; line-height: 1.6; font-size: 14px;">
                                        <p style="margin: 0 0 16px 0; font-size: 16px; color: #09090b;">Hello <strong>${recipientName}</strong>,</p>
                                        <p style="margin: 0 0 20px 0; color: #52525b;">We received a request to reset your password for your SK LABA PHONE management account.</p>
                                        <div style="margin: 30px 0; text-align: center;">
                                            <a href="${resetUrl}" style="background: linear-gradient(135deg, #09090b 0%, #18181b 60%, #4c0519 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 13px; display: inline-block; border: 1px solid #27272a; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">Reset Password</a>
                                        </div>
                                        <p style="font-size: 12px; color: #71717a; text-align: center;">This link will expire in 15 minutes. If you did not request a password reset, no action is required.</p>
                                        <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 24px 0;" />
                                        <p style="font-size: 11px; color: #a1a1aa; line-height: 1.5; margin: 0;">
                                            If the button above does not work, copy and paste this URL into your browser:<br />
                                            <a href="${resetUrl}" style="color: #be123c; word-break: break-all;">${resetUrl}</a>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 16px 30px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #a1a1aa;">
                                        © ${new Date().getFullYear()} SK LABA PHONE. All rights reserved. • South Korea
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            await this.transporter.sendMail({
                from: sender,
                to,
                subject,
                text: textContent,
                html: htmlContent
            });
            return true;
        } catch (error) {
            console.error('[EmailService] SMTP delivery error:', error.message);
            return false;
        }
    }

    /**
     * Send congratulatory winner notification email to giveaway winner
     * @param {Object} options
     * @param {string} options.to - Recipient email
     * @param {string} options.winnerName - Winner display name
     * @param {string} options.giveawayTitle - Title of the giveaway
     * @returns {Promise<boolean>}
     */
    async sendGiveawayWinnerEmail({ to, winnerName, giveawayTitle }) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('[EmailService] SMTP is not configured. Giveaway winner email not dispatched.');
            return false;
        }

        const sender = process.env.EMAIL_FROM || '"SK LABA PHONE" <no-reply@sklabaphone.com>';
        const name = winnerName || 'Winner';
        const subject = `🎉 Congratulations! You won the "${giveawayTitle}" Giveaway! — SK LABA PHONE`;

        const textContent = `Hello ${name},\n\n🎉 CONGRATULATIONS! 🎉\n\nYou have been selected as the official winner of our giveaway: "${giveawayTitle}"!\n\nPlease contact SK LABA PHONE as soon as possible to claim your prize and confirm delivery or store pickup.\n\nShop Contact Details:\n• Phone: +82 10-5892-7482\n• WhatsApp: +82 10-5892-7482\n• Email: contact@sklabaphone.com\n• Address: Dongdaemun-gu, Seoul, South Korea\n• Hours: Mon - Sun: 10:00 AM - 9:00 PM (KST)\n\nThank you for participating with SK LABA PHONE!\n\nBest regards,\nSK LABA PHONE Team`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>SK LABA PHONE — Giveaway Winner</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <table width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
                                <!-- Brand Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #09090b 0%, #18181b 70%, #dc2626 100%); padding: 26px 30px; border-bottom: 2px solid #ef4444; text-align: left;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <span style="font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff; display: block;">SK LABA PHONE</span>
                                                    <span style="font-size: 11px; font-weight: 600; color: #fecaca; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 2px;">Official Giveaway Winner Announcement 🎁</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Content Body -->
                                <tr>
                                    <td style="padding: 32px 30px; color: #27272a; line-height: 1.6; font-size: 14px;">
                                        <div style="text-align: center; margin-bottom: 24px;">
                                            <span style="font-size: 40px; display: block; margin-bottom: 8px;">🎉🏆🎁</span>
                                            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #09090b;">Congratulations, ${name}!</h1>
                                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #dc2626; font-weight: 600;">You are the official winner of our giveaway!</p>
                                        </div>

                                        <p style="margin: 0 0 16px 0; color: #3f3f46; font-size: 15px;">
                                            We are thrilled to announce that your entry has been selected for the giveaway:
                                        </p>

                                        <!-- Giveaway Card -->
                                        <div style="background: #fef2f2; border: 1.5px dashed #f87171; border-radius: 12px; padding: 18px 20px; margin: 20px 0; text-align: center;">
                                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #991b1b; display: block; margin-bottom: 6px;">Giveaway Prize Event</span>
                                            <strong style="font-size: 17px; color: #7f1d1d; display: block;">${giveawayTitle}</strong>
                                        </div>

                                        <p style="margin: 20px 0 12px 0; color: #3f3f46; font-size: 14px; font-weight: 600;">
                                            How to claim your prize:
                                        </p>
                                        <p style="margin: 0 0 20px 0; color: #52525b; font-size: 14px;">
                                            Please contact <strong>SK LABA PHONE</strong> using the contact information below with this email address (<strong>${to}</strong>) and your identity verification to arrange prize delivery or store collection.
                                        </p>

                                        <!-- Shop Contact Details Card -->
                                        <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 4px solid #dc2626; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
                                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #71717a; display: block; margin-bottom: 12px;">Shop Contact Information</span>
                                            <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 13px;">
                                                <tr>
                                                    <td style="color: #71717a; width: 110px;">📞 Phone:</td>
                                                    <td style="font-weight: 600; color: #09090b;"><a href="tel:+821058927482" style="color: #09090b; text-decoration: none;">+82 10-5892-7482</a></td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #71717a;">💬 WhatsApp:</td>
                                                    <td style="font-weight: 600; color: #16a34a;"><a href="https://wa.me/821058927482" style="color: #16a34a; text-decoration: none;">+82 10-5892-7482 (Chat on WhatsApp)</a></td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #71717a;">✉️ Email:</td>
                                                    <td style="font-weight: 600; color: #09090b;"><a href="mailto:contact@sklabaphone.com" style="color: #dc2626; text-decoration: none;">contact@sklabaphone.com</a></td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #71717a;">📍 Address:</td>
                                                    <td style="font-weight: 600; color: #09090b;">Dongdaemun-gu, Seoul, South Korea</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #71717a;">⏰ Hours:</td>
                                                    <td style="font-weight: 600; color: #09090b;">Mon - Sun: 10:00 AM - 9:00 PM (KST)</td>
                                                </tr>
                                            </table>
                                        </div>

                                        <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px;">
                                            Thank you for being a valued part of the SK LABA PHONE community!
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 16px 30px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #a1a1aa;">
                                        © ${new Date().getFullYear()} SK LABA PHONE • Seoul, South Korea • <a href="https://sklabaphone.com" style="color: #a1a1aa;">sklabaphone.com</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            await this.transporter.sendMail({
                from: sender,
                to,
                subject,
                text: textContent,
                html: htmlContent
            });
            return true;
        } catch (error) {
            console.error(`[EmailService] Failed to send giveaway winner email to ${to}:`, error.message);
            return false;
        }
    }

    /**
     * Send Marketplace Seller Approval Email
     * Shows: Phone, Listed Price, Commission Rate, Commission Amount, Expected Amount You Will Receive
     */
    async sendMarketplaceSellerApprovalEmail({
        to,
        sellerName,
        phoneBrand,
        phoneModel,
        storage,
        listingRef,
        listedPrice,
        commissionRate,
        commissionAmount,
        expectedPayout
    }) {
        if (!to || typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
            console.error('[EmailService] Marketplace approval email skipped: invalid or missing seller email address:', to);
            return false;
        }

        if (!this.isConfigured || !this.transporter) {
            this.initTransporter();
        }

        if (!this.isConfigured || !this.transporter) {
            console.warn('[EmailService] SMTP is not configured. Approval email simulated in this environment.');
            return false;
        }

        const sender = process.env.EMAIL_FROM || '"SK LABA PHONE" <no-reply@sklabaphone.com>';
        const recipientName = sellerName || 'Valued Seller';
        const formattedPrice = Number(listedPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedCommission = Number(commissionAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedPayout = Number(expectedPayout).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const subject = 'SK LABA PHONE Marketplace — Your Listing Has Been Approved';
        const textContent = `Hello ${recipientName},

Your phone listing has been approved by SK LABA PHONE.
Your listing is now available on the SK LABA PHONE Marketplace.

Listing Reference: ${listingRef || 'N/A'}
Brand: ${phoneBrand || 'N/A'}
Model: ${phoneModel || 'N/A'}
Storage: ${storage || 'N/A'}
Listed Price: Rs. ${formattedPrice}
Platform Commission: ${commissionRate}%
Commission Amount: Rs. ${formattedCommission}
Expected Amount You Will Receive: Rs. ${formattedPayout}

Please Note:
The amount above represents your expected seller payout once the buyer confirms delivery and verification is completed. Payout is released after delivery confirmation. You have NOT been paid yet.

Thank you for selling with SK LABA PHONE!

Best regards,
SK LABA PHONE Marketplace Team`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8" /></head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
                                <tr>
                                    <td style="background-color: #09090b; padding: 28px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">SK LABA PHONE</h1>
                                        <p style="color: #a1a1aa; margin: 4px 0 0; font-size: 13px;">Phone Marketplace</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 30px;">
                                        <div style="background-color: #ecfdf5; border-radius: 10px; padding: 14px 18px; border-left: 4px solid #10b981; margin-bottom: 24px;">
                                            <p style="margin: 0; font-weight: 600; color: #065f46; font-size: 14px;">Listing Approved & Published</p>
                                            <p style="margin: 4px 0 0; font-size: 13px; color: #047857;">Your phone listing has been approved. Your listing is now available on the SK LABA PHONE Marketplace.</p>
                                        </div>
                                        <p style="font-size: 14px; color: #3f3f46; margin: 0 0 16px;">Hello <strong>${recipientName}</strong>,</p>
                                        <table width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
                                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                                <td style="padding: 10px 0; color: #71717a; font-size: 13px;">Listing Reference:</td>
                                                <td style="padding: 10px 0; font-weight: 600; text-align: right; font-size: 13px;">${listingRef || 'N/A'}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                                <td style="padding: 10px 0; color: #71717a; font-size: 13px;">Brand:</td>
                                                <td style="padding: 10px 0; font-weight: 600; text-align: right; font-size: 13px;">${phoneBrand || 'N/A'}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                                <td style="padding: 10px 0; color: #71717a; font-size: 13px;">Model:</td>
                                                <td style="padding: 10px 0; font-weight: 600; text-align: right; font-size: 13px;">${phoneModel || 'N/A'}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                                <td style="padding: 10px 0; color: #71717a; font-size: 13px;">Storage:</td>
                                                <td style="padding: 10px 0; font-weight: 600; text-align: right; font-size: 13px;">${storage || 'N/A'}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                                <td style="padding: 10px 0; color: #71717a; font-size: 13px;">Listed Price:</td>
                                                <td style="padding: 10px 0; font-weight: 600; text-align: right; font-size: 13px;">Rs. ${formattedPrice}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                                <td style="padding: 10px 0; color: #71717a; font-size: 13px;">Platform Commission:</td>
                                                <td style="padding: 10px 0; font-weight: 600; text-align: right; font-size: 13px; color: #d97706;">${commissionRate}%</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                                <td style="padding: 10px 0; color: #71717a; font-size: 13px;">Commission Amount:</td>
                                                <td style="padding: 10px 0; font-weight: 600; text-align: right; font-size: 13px; color: #d97706;">Rs. ${formattedCommission}</td>
                                            </tr>
                                            <tr style="background-color: #f8fafc;">
                                                <td style="padding: 12px 10px; font-weight: 700; color: #0f172a; font-size: 14px;">Expected Amount You Will Receive:</td>
                                                <td style="padding: 12px 10px; font-weight: 700; text-align: right; color: #16a34a; font-size: 16px;">Rs. ${formattedPayout}</td>
                                            </tr>
                                        </table>
                                        <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 16px 0 0;">
                                            <em>Note: The amount shown is your expected seller payout once the buyer confirms delivery and verification is completed. Payout is released after delivery confirmation.</em>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 16px 30px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #a1a1aa;">
                                        &copy; ${new Date().getFullYear()} SK LABA PHONE • <a href="https://sklabaphone.com" style="color: #a1a1aa;">sklabaphone.com</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            await this.transporter.sendMail({
                from: sender,
                to,
                subject,
                text: textContent,
                html: htmlContent
            });
            console.log(`[EmailService] Marketplace approval email successfully sent to ${to} (Ref: ${listingRef})`);
            return true;
        } catch (error) {
            console.error('[EmailService] Marketplace approval email failed', {
                listingRef: listingRef || 'N/A',
                emailType: 'SELLER_APPROVAL',
                recipient: to,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Send Marketplace Seller Rejection Email
     * Shows: Phone, Rejection Reason, Support info
     */
    async sendMarketplaceSellerRejectionEmail({
        to,
        sellerName,
        phoneBrand,
        phoneModel,
        listingRef,
        rejectionReason
    }) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('[EmailService] SMTP is not configured. Rejection email simulated in this environment.');
            return false;
        }

        const sender = process.env.EMAIL_FROM || '"SK LABA PHONE" <no-reply@sklabaphone.com>';
        const recipientName = sellerName || 'Valued Seller';
        const phoneTitle = [phoneBrand, phoneModel].filter(Boolean).join(' ') || 'Phone';

        const subject = 'SK LABA PHONE Marketplace — Submission Update';
        const textContent = `Hello ${recipientName},

Your SK LABA PHONE Marketplace submission was not approved.

Listing Reference: ${listingRef || 'N/A'}
Phone: ${phoneTitle}
Status: REJECTED

Reason for Rejection:
${rejectionReason || 'Does not meet marketplace submission criteria.'}

Please contact SK LABA PHONE if you require further information or wish to resubmit.
WhatsApp / Phone: +82 10-5892-7482
Email: contact@sklabaphone.com

Best regards,
SK LABA PHONE Marketplace Team`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8" /></head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
                                <tr>
                                    <td style="background-color: #09090b; padding: 28px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">SK LABA PHONE</h1>
                                        <p style="color: #a1a1aa; margin: 4px 0 0; font-size: 13px;">Phone Marketplace</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 30px;">
                                        <div style="background-color: #fef2f2; border-radius: 10px; padding: 14px 18px; border-left: 4px solid #ef4444; margin-bottom: 24px;">
                                            <p style="margin: 0; font-weight: 600; color: #991b1b; font-size: 14px;">Marketplace Submission Not Approved</p>
                                        </div>
                                        <p style="font-size: 14px; color: #3f3f46; margin: 0 0 16px;">Hello <strong>${recipientName}</strong>,</p>
                                        <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 16px;">
                                            Your phone submission for <strong>${phoneTitle}</strong> (Ref: ${listingRef || 'N/A'}) was not approved for listing on the Marketplace.
                                        </p>
                                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                                            <p style="font-size: 12px; font-weight: 700; color: #64748b; margin: 0 0 6px; text-transform: uppercase;">Reason for Rejection:</p>
                                            <p style="font-size: 14px; color: #1e293b; margin: 0; line-height: 1.5;">${rejectionReason || 'Does not meet marketplace submission criteria.'}</p>
                                        </div>
                                        <p style="font-size: 13px; color: #71717a; line-height: 1.5; margin: 16px 0 0;">
                                            If you have questions or wish to rectify the issues and resubmit, please reach out to us at <a href="mailto:contact@sklabaphone.com" style="color: #2563eb;">contact@sklabaphone.com</a> or via WhatsApp at <strong>+82 10-5892-7482</strong>.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 16px 30px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #a1a1aa;">
                                        &copy; ${new Date().getFullYear()} SK LABA PHONE • <a href="https://sklabaphone.com" style="color: #a1a1aa;">sklabaphone.com</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            await this.transporter.sendMail({
                from: sender,
                to,
                subject,
                text: textContent,
                html: htmlContent
            });
            return true;
        } catch (error) {
            console.error(`[EmailService] Failed to send rejection email to ${to}:`, error.message);
            return false;
        }
    }

    /**
     * Send Marketplace Changes Requested Email
     * Shows: Phone, Required Changes / Instructions, Support info
     */
    async sendMarketplaceChangesRequestedEmail({
        to,
        sellerName,
        phoneBrand,
        phoneModel,
        listingRef,
        changesRequestedReason
    }) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('[EmailService] SMTP is not configured. Changes requested email simulated in this environment.');
            return false;
        }

        const sender = process.env.EMAIL_FROM || '"SK LABA PHONE" <no-reply@sklabaphone.com>';
        const recipientName = sellerName || 'Valued Seller';
        const phoneTitle = [phoneBrand, phoneModel].filter(Boolean).join(' ') || 'Phone';

        const subject = 'SK LABA PHONE Marketplace — Changes Requested for Your Submission';
        const textContent = `Hello ${recipientName},

Our review team has requested changes for your Marketplace phone submission.

Listing Reference: ${listingRef || 'N/A'}
Phone: ${phoneTitle}
Status: CHANGES REQUESTED

Required Changes / Instructions:
${changesRequestedReason || 'Please review and update your listing details or photos.'}

Please update your listing or reply to this email with updated information.
WhatsApp / Phone: +82 10-5892-7482

Best regards,
SK LABA PHONE Marketplace Team`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8" /></head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
                                <tr>
                                    <td style="background-color: #09090b; padding: 28px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">SK LABA PHONE</h1>
                                        <p style="color: #a1a1aa; margin: 4px 0 0; font-size: 13px;">Phone Marketplace</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 30px;">
                                        <div style="background-color: #fffbeb; border-radius: 10px; padding: 14px 18px; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
                                            <p style="margin: 0; font-weight: 600; color: #92400e; font-size: 14px;">Action Required: Changes Requested</p>
                                        </div>
                                        <p style="font-size: 14px; color: #3f3f46; margin: 0 0 16px;">Hello <strong>${recipientName}</strong>,</p>
                                        <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 16px;">
                                            Before we can approve your listing for <strong>${phoneTitle}</strong> (Ref: ${listingRef || 'N/A'}), please provide the requested updates below:
                                        </p>
                                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                                            <p style="font-size: 12px; font-weight: 700; color: #64748b; margin: 0 0 6px; text-transform: uppercase;">Required Changes:</p>
                                            <p style="font-size: 14px; color: #1e293b; margin: 0; line-height: 1.5;">${changesRequestedReason || 'Please review and update your listing details or photos.'}</p>
                                        </div>
                                        <p style="font-size: 13px; color: #71717a; line-height: 1.5; margin: 16px 0 0;">
                                            Need assistance? Reach out to us via WhatsApp at <strong>+82 10-5892-7482</strong> or email <a href="mailto:contact@sklabaphone.com" style="color: #2563eb;">contact@sklabaphone.com</a>.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 16px 30px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #a1a1aa;">
                                        &copy; ${new Date().getFullYear()} SK LABA PHONE • <a href="https://sklabaphone.com" style="color: #a1a1aa;">sklabaphone.com</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            await this.transporter.sendMail({
                from: sender,
                to,
                subject,
                text: textContent,
                html: htmlContent
            });
            return true;
        } catch (error) {
            console.error(`[EmailService] Failed to send changes requested email to ${to}:`, error.message);
            return false;
        }
    }
}

module.exports = new EmailService();
module.exports.EmailService = EmailService;
