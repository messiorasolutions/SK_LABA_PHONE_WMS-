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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
                <h2 style="color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">SK LABA PHONE Dashboard</h2>
                <p>Hello <strong>${recipientName}</strong>,</p>
                <p>We received a request to reset your password for your SK LABA PHONE management account.</p>
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #64748b;">This link will expire in 15 minutes. If you did not request a password reset, no action is required.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #94a3b8;">If the button above does not work, copy and paste this URL into your browser:<br /><a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a></p>
            </div>
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
