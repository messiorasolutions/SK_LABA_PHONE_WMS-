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