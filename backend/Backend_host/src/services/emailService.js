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
}

module.exports = new EmailService();
module.exports.EmailService = EmailService;
