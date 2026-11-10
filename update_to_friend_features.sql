-- =====================================================================
-- SK LABA PHONE WMS - Database Update / Migration Script
-- Purpose: Safely update existing database with friend's new features:
--          1. Customer-to-Customer (C2C) Marketplace System
--          2. Stock Movement History Tracking
--          3. Expanded User Roles (ADMIN, STAFF, USER)
--          4. Marketplace integration with Phones & Reservations
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+ (phpMyAdmin / XAMPP)
-- Existing data (users, phones, inquiries, reviews, reservations) is PRESERVED.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ---------------------------------------------------------------------
-- 1. UPDATE EXISTING TABLES
-- ---------------------------------------------------------------------

-- 1.1 Expand dashboard_users role enum to include 'USER'
ALTER TABLE `dashboard_users` 
  MODIFY COLUMN `role` ENUM('ADMIN', 'STAFF', 'USER') NOT NULL DEFAULT 'STAFF';

-- ---------------------------------------------------------------------
-- 2. CREATE NEW TABLES (Marketplace & Stock History)
-- ---------------------------------------------------------------------

-- 2.1 Marketplace Terms & Conditions (Buyer & Seller)
CREATE TABLE IF NOT EXISTS `marketplace_terms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `term_type` enum('SELLER','BUYER') NOT NULL,
  `version` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` mediumtext NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mkp_terms_created_user` (`created_by`),
  KEY `idx_mkp_terms_type_active` (`term_type`,`is_active`),
  KEY `idx_mkp_terms_version` (`term_type`,`version`),
  CONSTRAINT `fk_mkp_terms_created_user` FOREIGN KEY (`created_by`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 Marketplace Platform Settings (Commission %, etc.)
CREATE TABLE IF NOT EXISTS `marketplace_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`),
  KEY `fk_mkp_settings_updated_user` (`updated_by`),
  CONSTRAINT `fk_mkp_settings_updated_user` FOREIGN KEY (`updated_by`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 Marketplace Phone Listings (C2C submissions)
CREATE TABLE IF NOT EXISTS `marketplace_listings` (
  `listing_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `seller_id` bigint unsigned DEFAULT NULL,
  `seller_name` varchar(150) NOT NULL,
  `seller_email` varchar(255) NOT NULL,
  `seller_phone` varchar(30) NOT NULL,
  `brand_id` bigint unsigned DEFAULT NULL,
  `brand` varchar(100) NOT NULL,
  `model` varchar(150) NOT NULL,
  `storage` varchar(50) NOT NULL,
  `color` varchar(50) NOT NULL,
  `condition_grade` enum('BRAND_NEW','LIKE_NEW','EXCELLENT','VERY_GOOD','GOOD','FAIR') NOT NULL DEFAULT 'VERY_GOOD',
  `condition_description` text NOT NULL,
  `physical_condition` text DEFAULT NULL,
  `display_condition` text DEFAULT NULL,
  `camera_condition` text DEFAULT NULL,
  `biometrics_status` varchar(100) DEFAULT NULL,
  `battery_health` int unsigned DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `description` text DEFAULT NULL,
  `accessories_included` json DEFAULT NULL,
  `original_box` tinyint(1) NOT NULL DEFAULT 0,
  `charger_included` tinyint(1) NOT NULL DEFAULT 0,
  `warranty_info` varchar(255) DEFAULT NULL,
  `photos` json NOT NULL,
  `status` enum('PENDING_REVIEW','UNDER_REVIEW','CHANGES_REQUESTED','APPROVED','REJECTED','PUBLISHED','RESERVED','SOLD','CANCELLED','EXPIRED','UNPUBLISHED') NOT NULL DEFAULT 'PENDING_REVIEW',
  `seller_terms_version` varchar(50) NOT NULL DEFAULT '1.0',
  `seller_terms_accepted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_notes` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `changes_requested_reason` text DEFAULT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`listing_id`),
  KEY `fk_mkp_listings_brand` (`brand_id`),
  KEY `fk_mkp_listings_reviewer` (`reviewed_by`),
  KEY `fk_mkp_listings_approver` (`approved_by`),
  KEY `idx_mkp_listings_status` (`status`),
  KEY `idx_mkp_listings_seller_id` (`seller_id`),
  KEY `idx_mkp_listings_brand_model` (`brand`,`model`),
  KEY `idx_mkp_listings_price` (`price`),
  KEY `idx_mkp_listings_created` (`created_at`),
  CONSTRAINT `fk_mkp_listings_approver` FOREIGN KEY (`approved_by`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mkp_listings_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`brand_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mkp_listings_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mkp_listings_seller` FOREIGN KEY (`seller_id`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.4 Marketplace Orders (Escrow, verification, payout tracking)
CREATE TABLE IF NOT EXISTS `marketplace_orders` (
  `order_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `listing_id` bigint unsigned NOT NULL,
  `buyer_id` bigint unsigned DEFAULT NULL,
  `buyer_name` varchar(150) NOT NULL,
  `buyer_email` varchar(255) NOT NULL,
  `buyer_phone` varchar(30) NOT NULL,
  `delivery_type` enum('PICKUP','DELIVERY') NOT NULL DEFAULT 'PICKUP',
  `delivery_address` text DEFAULT NULL,
  `seller_id` bigint unsigned NOT NULL,
  `selling_price` decimal(12,2) NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT 5.00,
  `commission_amount` decimal(12,2) NOT NULL,
  `seller_payout` decimal(12,2) NOT NULL,
  `payment_method` enum('BANK_TRANSFER','CASH_ON_COLLECTION','ONLINE_GATEWAY') NOT NULL DEFAULT 'CASH_ON_COLLECTION',
  `payment_status` enum('PENDING','ESCROW_HELD','SELLER_PAID','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `payment_reference` varchar(150) DEFAULT NULL,
  `payment_confirmed_by` bigint unsigned DEFAULT NULL,
  `payment_confirmed_at` timestamp NULL DEFAULT NULL,
  `phone_verified_by` bigint unsigned DEFAULT NULL,
  `phone_verified_at` timestamp NULL DEFAULT NULL,
  `verification_notes` text DEFAULT NULL,
  `seller_paid_by` bigint unsigned DEFAULT NULL,
  `seller_paid_at` timestamp NULL DEFAULT NULL,
  `seller_payout_reference` varchar(150) DEFAULT NULL,
  `delivery_status` enum('PENDING','SELLER_SHIPPED_TO_HUB','HUB_RECEIVED','DELIVERY_IN_TRANSIT','DELIVERED','COLLECTED') NOT NULL DEFAULT 'PENDING',
  `delivery_confirmed_by` bigint unsigned DEFAULT NULL,
  `delivery_confirmed_at` timestamp NULL DEFAULT NULL,
  `status` enum('ORDER_PLACED','PAYMENT_PENDING','PAYMENT_CONFIRMED','PHONE_RECEIVED_AT_HUB','VERIFIED_BY_TECHNICIAN','REJECTED_AT_HUB','OUT_FOR_DELIVERY','READY_FOR_PICKUP','COMPLETED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'ORDER_PLACED',
  `buyer_terms_version` varchar(50) NOT NULL DEFAULT '1.0',
  `buyer_terms_accepted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `fk_mkp_orders_listing` (`listing_id`),
  KEY `fk_mkp_orders_buyer` (`buyer_id`),
  KEY `fk_mkp_orders_seller` (`seller_id`),
  KEY `fk_mkp_orders_pay_conf_user` (`payment_confirmed_by`),
  KEY `fk_mkp_orders_verif_user` (`phone_verified_by`),
  KEY `fk_mkp_orders_payout_user` (`seller_paid_by`),
  KEY `fk_mkp_orders_del_conf_user` (`delivery_confirmed_by`),
  KEY `idx_mkp_orders_status` (`status`),
  KEY `idx_mkp_orders_payment_status` (`payment_status`),
  KEY `idx_mkp_orders_delivery_status` (`delivery_status`),
  KEY `idx_mkp_orders_created` (`created_at`),
  CONSTRAINT `fk_mkp_orders_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mkp_orders_del_conf_user` FOREIGN KEY (`delivery_confirmed_by`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mkp_orders_listing` FOREIGN KEY (`listing_id`) REFERENCES `marketplace_listings` (`listing_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mkp_orders_pay_conf_user` FOREIGN KEY (`payment_confirmed_by`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mkp_orders_payout_user` FOREIGN KEY (`seller_paid_by`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mkp_orders_seller` FOREIGN KEY (`seller_id`) REFERENCES `dashboard_users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mkp_orders_verif_user` FOREIGN KEY (`phone_verified_by`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.5 Marketplace Audit Logs
CREATE TABLE IF NOT EXISTS `marketplace_audit_logs` (
  `log_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` enum('LISTING','ORDER','COMMISSION_SETTING','TERMS') NOT NULL,
  `entity_id` bigint unsigned NOT NULL,
  `action` varchar(60) NOT NULL,
  `actor_user_id` bigint unsigned DEFAULT NULL,
  `actor_role` varchar(30) NOT NULL DEFAULT 'SYSTEM',
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_mkp_audit_actor` (`actor_user_id`),
  KEY `idx_mkp_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_mkp_audit_action` (`action`),
  KEY `idx_mkp_audit_created` (`created_at`),
  CONSTRAINT `fk_mkp_audit_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `dashboard_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.6 Stock Movement History Tracking
CREATE TABLE IF NOT EXISTS `stock_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `phone_id` int NOT NULL,
  `phone_name` varchar(255) DEFAULT NULL,
  `transaction_type` enum('ADD','DEDUCT') NOT NULL,
  `quantity` int NOT NULL,
  `color_name` varchar(100) DEFAULT NULL,
  `storage_name` varchar(100) DEFAULT NULL,
  `reason` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT 'Admin',
  `previous_stock` int NOT NULL DEFAULT 0,
  `new_stock` int NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `idx_phone_type` (`phone_id`,`transaction_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.7 Schema Migrations Registry
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. ALTER PHONES TABLE (Marketplace Integration)
-- ---------------------------------------------------------------------
ALTER TABLE `phones`
  ADD COLUMN IF NOT EXISTS `product_source` enum('INVENTORY','MARKETPLACE') NOT NULL DEFAULT 'INVENTORY' AFTER `is_new_arrival`,
  ADD COLUMN IF NOT EXISTS `ownership_type` enum('PLATFORM_OWNED','SELLER_OWNED') NOT NULL DEFAULT 'PLATFORM_OWNED' AFTER `product_source`,
  ADD COLUMN IF NOT EXISTS `marketplace_listing_id` bigint unsigned DEFAULT NULL AFTER `ownership_type`,
  ADD COLUMN IF NOT EXISTS `battery_health` int unsigned DEFAULT NULL AFTER `marketplace_listing_id`,
  ADD COLUMN IF NOT EXISTS `used_condition_grade` varchar(50) DEFAULT NULL AFTER `battery_health`;

-- Add indexes if not present
ALTER TABLE `phones`
  ADD KEY IF NOT EXISTS `idx_phones_product_source` (`product_source`),
  ADD KEY IF NOT EXISTS `idx_phones_marketplace_listing` (`marketplace_listing_id`),
  ADD KEY IF NOT EXISTS `idx_phones_ownership_type` (`ownership_type`);

-- Drop constraint if already exists before re-adding (to avoid duplicate constraint errors)
SET @fk_phones_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'phones' AND CONSTRAINT_NAME = 'fk_phones_marketplace_listing');
SET @drop_fk_phones := IF(@fk_phones_exists > 0, 'ALTER TABLE `phones` DROP FOREIGN KEY `fk_phones_marketplace_listing`', 'SELECT 1');
PREPARE stmt FROM @drop_fk_phones;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `phones`
  ADD CONSTRAINT `fk_phones_marketplace_listing` 
  FOREIGN KEY (`marketplace_listing_id`) REFERENCES `marketplace_listings` (`listing_id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- 4. ALTER RESERVATIONS TABLE (Marketplace Integration & Nullable Phone)
-- ---------------------------------------------------------------------
ALTER TABLE `reservations`
  MODIFY COLUMN `phone_id` bigint(20) unsigned DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `marketplace_listing_id` bigint unsigned DEFAULT NULL AFTER `phone_id`,
  ADD COLUMN IF NOT EXISTS `reservation_type` enum('SMARTPHONE','MARKETPLACE') NOT NULL DEFAULT 'SMARTPHONE' AFTER `marketplace_listing_id`;

ALTER TABLE `reservations`
  ADD KEY IF NOT EXISTS `idx_reservations_marketplace_listing` (`marketplace_listing_id`),
  ADD KEY IF NOT EXISTS `idx_reservations_reservation_type` (`reservation_type`);

-- Drop constraint if already exists before re-adding
SET @fk_res_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'reservations' AND CONSTRAINT_NAME = 'fk_reservations_marketplace_listing');
SET @drop_fk_res := IF(@fk_res_exists > 0, 'ALTER TABLE `reservations` DROP FOREIGN KEY `fk_reservations_marketplace_listing`', 'SELECT 1');
PREPARE stmt FROM @drop_fk_res;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `reservations`
  ADD CONSTRAINT `fk_reservations_marketplace_listing` 
  FOREIGN KEY (`marketplace_listing_id`) REFERENCES `marketplace_listings` (`listing_id`) 
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- 5. SEED FOUNDATIONAL MARKETPLACE SETTINGS & TERMS
-- ---------------------------------------------------------------------
INSERT INTO `marketplace_settings` (`setting_key`, `setting_value`, `description`, `updated_by`, `updated_at`)
VALUES 
  ('commission_percentage', '5.00', 'Platform commission percentage charged on Marketplace phone sales', NULL, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

INSERT INTO `marketplace_terms` (`id`, `term_type`, `version`, `title`, `content`, `is_active`, `created_by`, `created_at`, `updated_at`)
VALUES 
  (1, 'SELLER', '1.0', 'SK LABA PHONE Marketplace Seller Terms & Conditions', 
   '1. The seller confirms lawful ownership of the listed device.\n2. Listed device condition, battery health, and details must be accurately reported.\n3. Upon buyer purchase confirmation, seller agrees to send/bring device to SK LABA PHONE hub for technician verification.\n4. Platform commission (5%) will be deducted from payout upon successful verification and delivery.\n5. If device fails technician verification or is counterfeit/stolen, it will be rejected and seller bears delivery return costs.', 
   1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 'BUYER', '1.0', 'SK LABA PHONE Marketplace Buyer Terms & Conditions', 
   '1. Marketplace devices are customer-to-customer listings verified by SK LABA PHONE technicians prior to release.\n2. Buyer payment is securely held in escrow until technician verification is completed.\n3. If device condition does not match listing specifications during inspection, buyer receives a 100% full refund.\n4. Once inspected and handed over / delivered, buyer acknowledges having inspected device functionality.', 
   1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `content` = VALUES(`content`);

-- Seed schema migrations records (1 - 15)
INSERT IGNORE INTO `schema_migrations` (`id`, `migration_name`, `executed_at`) VALUES
(1, '001_create_dashboard_users_and_sessions.sql', CURRENT_TIMESTAMP),
(2, '002_create_password_reset_tokens.sql', CURRENT_TIMESTAMP),
(3, '003_create_inquiries.sql', CURRENT_TIMESTAMP),
(4, '004_create_reservations.sql', CURRENT_TIMESTAMP),
(5, '005_add_available_colors_to_phones.sql', CURRENT_TIMESTAMP),
(6, '006_create_sell_trade_in_requests.sql', CURRENT_TIMESTAMP),
(7, '007_create_reviews.sql', CURRENT_TIMESTAMP),
(8, '008_create_shop_information.sql', CURRENT_TIMESTAMP),
(9, '009_create_activity_logs.sql', CURRENT_TIMESTAMP),
(10, '010_create_back_in_stock_alerts.sql', CURRENT_TIMESTAMP),
(11, '011_create_giveaway_and_newsletter.sql', CURRENT_TIMESTAMP),
(12, '012_add_stock_history_table.sql', CURRENT_TIMESTAMP),
(13, '013_create_marketplace_module.sql', CURRENT_TIMESTAMP),
(14, '014_integrate_marketplace_into_inventory_and_reservations.sql', CURRENT_TIMESTAMP),
(15, '015_seed_marketplace_defaults.sql', CURRENT_TIMESTAMP);

SET FOREIGN_KEY_CHECKS = 1;

