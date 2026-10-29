# Database

Database configuration and documentation.
- Database: MySQL (Hosted on Aiven)

CREATE TABLE brands (
    brand_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) 

CREATE TABLE storage_options (
    storage_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    storage_name VARCHAR(30) NOT NULL UNIQUE,
    capacity_gb INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_storage_capacity CHECK (capacity_gb > 0)
) 

CREATE TABLE specifications (
    specification_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    specification_name VARCHAR(100) NOT NULL,
    specification_type ENUM('TECHNICAL', 'ACCESSORY') NOT NULL,
    description VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_specification_name_type (specification_name, specification_type)
) 


CREATE TABLE installment_plans (
    installment_plan_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(150) NOT NULL,
    number_of_months SMALLINT UNSIGNED NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    additional_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    terms TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_installment_months CHECK (number_of_months > 0),
    CONSTRAINT chk_installment_interest CHECK (interest_rate >= 0),
    CONSTRAINT chk_installment_fee CHECK (additional_fee >= 0)
) 

CREATE TABLE phones (
    phone_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    brand_id BIGINT UNSIGNED NOT NULL,
    phone_condition ENUM('NEW', 'USED') NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    storage_ids JSON NULL,
    colour_options JSON NULL,
    specification_ids JSON NULL,
    warranty VARCHAR(255) NULL,
    accessory_ids JSON NULL,
    description TEXT NULL,
    stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    availability ENUM('IN_STOCK', 'LOW_STOCK', 'SOLD_OUT', 'COMING_SOON') NOT NULL DEFAULT 'SOLD_OUT',
    installment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    installment_plan_ids JSON NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    photos JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_phones_brand FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_phone_price CHECK (price >= 0),
    CONSTRAINT chk_storage_json CHECK (storage_ids IS NULL OR JSON_VALID(storage_ids)),
    CONSTRAINT chk_colour_json CHECK (colour_options IS NULL OR JSON_VALID(colour_options)),
    CONSTRAINT chk_spec_json CHECK (specification_ids IS NULL OR JSON_VALID(specification_ids)),
    CONSTRAINT chk_accessory_json CHECK (accessory_ids IS NULL OR JSON_VALID(accessory_ids)),
    CONSTRAINT chk_plan_json CHECK (installment_plan_ids IS NULL OR JSON_VALID(installment_plan_ids)),
    CONSTRAINT chk_photos_json CHECK (photos IS NULL OR JSON_VALID(photos)),
    INDEX idx_phones_brand (brand_id),
    INDEX idx_phones_status (status),
    INDEX idx_phones_price (price)
) ENGINE=InnoDB;


CREATE TABLE dashboard_users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    display_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dashboard_users_role (role),
    INDEX idx_dashboard_users_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
    session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
    expires INT(11) UNSIGNED NOT NULL,
    data MEDIUMTEXT COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

## Database Migrations

SQL migration files are maintained in `database/migrations/`.
To run all pending migrations against the configured MySQL database:

```bash
cd backend
npm run migrate
```


CREATE TABLE password_reset_tokens (
    reset_token_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    consumed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES dashboard_users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_password_resets_user (user_id),
    INDEX idx_password_resets_token (token_hash),
    INDEX idx_password_resets_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inquiries (
    inquiry_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    phone_id BIGINT UNSIGNED NULL,
    status ENUM('New', 'In Progress', 'Contacted', 'Closed') NOT NULL DEFAULT 'New',
    assigned_to_user_id BIGINT UNSIGNED NULL,
    updated_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inquiries_phone FOREIGN KEY (phone_id) REFERENCES phones(phone_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_inquiries_assigned_user FOREIGN KEY (assigned_to_user_id) REFERENCES dashboard_users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_inquiries_updated_user FOREIGN KEY (updated_by_user_id) REFERENCES dashboard_users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_inquiries_status (status),
    INDEX idx_inquiries_phone_id (phone_id),
    INDEX idx_inquiries_assigned_to (assigned_to_user_id),
    INDEX idx_inquiries_created_at (created_at),
    INDEX idx_inquiries_customer_name (customer_name),
    INDEX idx_inquiries_phone_number (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reservations (
    reservation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(255) NULL,
    phone_id BIGINT UNSIGNED NOT NULL,
    selected_options JSON NULL,
    preferred_collection_date DATE NOT NULL,
    customer_note TEXT NULL,
    status ENUM('Pending', 'Confirmed', 'Ready for Collection', 'Collected', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Pending',
    assigned_to_user_id BIGINT UNSIGNED NULL,
    updated_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservations_phone FOREIGN KEY (phone_id) REFERENCES phones(phone_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reservations_assigned_user FOREIGN KEY (assigned_to_user_id) REFERENCES dashboard_users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_reservations_updated_user FOREIGN KEY (updated_by_user_id) REFERENCES dashboard_users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_reservations_options_json CHECK (selected_options IS NULL OR JSON_VALID(selected_options)),
    INDEX idx_reservations_status (status),
    INDEX idx_reservations_phone_id (phone_id),
    INDEX idx_reservations_collection_date (preferred_collection_date),
    INDEX idx_reservations_customer_name (customer_name),
    INDEX idx_reservations_phone_number (phone_number),
    INDEX idx_reservations_assigned_to (assigned_to_user_id),
    INDEX idx_reservations_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
