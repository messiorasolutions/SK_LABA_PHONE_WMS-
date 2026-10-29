# Backend - SK LABA PHONE WMS

Warehouse Management System Backend API for SK LABA PHONE.

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express 5
- **Database**: MySQL (Aiven) with `mysql2/promise`
- **Architecture**: Controller → Service → Repository
- **Authentication**: Session-based with MySQL session store (`express-mysql-session`), Argon2id hashing, and role-based authorization (`ADMIN`, `STAFF`).
- **Transactional Email**: Nodemailer via SMTP for password reset workflows.

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in your MySQL connection settings, session secrets, and SMTP configuration:

```bash
cp .env.example .env
```

### 2. Run Database Migrations

Apply database schema migrations to create `dashboard_users`, `sessions`, `password_reset_tokens`, and tracking tables:

```bash
npm run migrate
```

### 3. Provision Initial Admin Account

Bootstrap the first administrative user without requiring an active session:

```bash
npm run create-admin
```

Follow the prompts to enter:
- Display Name
- Email Address
- Role (`ADMIN` or `STAFF`)
- Secure Password (min 8 characters, masked input)

### 4. Start the Application

```bash
# Production mode
npm start

# Development mode (watch)
npm run dev
```

### 5. Run Automated Tests

Execute the comprehensive test suite:

```bash
npm test
```

## Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Log in with email & password, establish server session | No (Rate limited) |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Yes |
| `POST` | `/api/auth/logout` | Invalidate session on server and clear cookie | Yes |
| `GET` | `/api/auth/csrf-token` | Fetch current session CSRF token | Session-only |
| `POST` | `/api/auth/forgot-password` | Request a password reset link (single-use token, expires in 15 min) | No (Rate limited) |
| `POST` | `/api/auth/reset-password` | Atomically reset password with valid token and revoke all active sessions | No (Rate limited) |

## SMTP Configuration

Password reset links are dispatched via SMTP:
- `SMTP_HOST`: Hostname of SMTP provider (e.g. `smtp.sendgrid.net`, `smtp.mailgun.org`, `smtp.gmail.com`)
- `SMTP_PORT`: Port (usually `587` for STARTTLS or `465` for SSL/TLS)
- `SMTP_SECURE`: `true` if port 465, `false` otherwise
- `SMTP_USER`: SMTP account username
- `SMTP_PASS`: SMTP account password / API key
- `EMAIL_FROM`: Sender address, e.g. `"SK LABA PHONE" <no-reply@sklabaphone.com>`
- `PASSWORD_RESET_BASE_URL`: Base URL of the dashboard frontend (e.g. `https://admin.sklabaphone.com`). The reset link format is `${PASSWORD_RESET_BASE_URL}/reset-password?token=${rawToken}`.

If SMTP is unconfigured or unavailable, the endpoint fails safely by logging an operational warning and still returning the identical generic success response to prevent email enumeration or client disruptions.

## Role-Based Access Control

Two server-authorized roles are supported:
- `ADMIN`: Full access to all administrative modules, settings, and user management.
- `STAFF`: Restricted access to daily warehouse operations and management.
