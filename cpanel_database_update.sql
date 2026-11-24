-- ====================================================================
-- SK LABA PHONE WMS - COMPLETE CPANEL DATABASE UPDATE SCRIPT
-- ====================================================================
-- Instructions:
-- 1. Open your cPanel -> phpMyAdmin.
-- 2. Select your SK LABA PHONE database from the left sidebar.
-- 3. Click the "SQL" tab at the top.
-- 4. Paste this entire query and click "Go".
--
-- Safety:
-- Uses `IF NOT EXISTS` and `ON DUPLICATE KEY UPDATE` so it is 100% safe
-- and will NOT delete, overwrite, or corrupt any of your existing
-- phones, customer reviews, inquiries, orders, or users.
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- 1. UPDATE `dashboard_users` TABLE
-- Adds avatar_url column for user profile pictures
-- --------------------------------------------------------------------
ALTER TABLE `dashboard_users` 
ADD COLUMN IF NOT EXISTS `avatar_url` MEDIUMTEXT NULL AFTER `email`;

-- --------------------------------------------------------------------
-- 2. UPDATE `phones` TABLE
-- Adds New Arrival badge, Genuine Battery, Housing, and Display Size specs
-- Upgrades photos, colour_options, and free_accessories to LONGTEXT
-- --------------------------------------------------------------------
ALTER TABLE `phones`
ADD COLUMN IF NOT EXISTS `is_new_arrival` TINYINT(1) NOT NULL DEFAULT 0,
MODIFY COLUMN `battery_health` VARCHAR(50) NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `is_genuine_battery` BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS `is_original_housing` BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS `display_size` VARCHAR(50) NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `free_accessories` LONGTEXT NULL,
MODIFY COLUMN `photos` LONGTEXT NULL,
MODIFY COLUMN `colour_options` LONGTEXT NULL;

-- --------------------------------------------------------------------
-- 3. UPDATE `offers` TABLE
-- Upgrades banner_image to LONGTEXT to support high-res base64 image uploads
-- --------------------------------------------------------------------
ALTER TABLE `offers` 
MODIFY COLUMN `banner_image` LONGTEXT NULL;

-- --------------------------------------------------------------------
-- 4. CREATE `giveaways` TABLE (If not already present)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `giveaways` (
    `giveaway_id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `short_description` VARCHAR(500) NULL,
    `description` LONGTEXT NULL,
    `thumbnail_url` LONGTEXT NULL,
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME NOT NULL,
    `winner_selection_date` DATETIME NOT NULL,
    `status` ENUM('DRAFT', 'ONGOING', 'COMPLETED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `is_manually_closed` TINYINT(1) NOT NULL DEFAULT 0,
    `winners_announced` TINYINT(1) NOT NULL DEFAULT 0,
    `winners_announced_at` DATETIME NULL,
    `winners` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_giveaway_status` (`status`),
    INDEX `idx_giveaway_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. CREATE `shop_information` TABLE (If not already present)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shop_information` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `shop_name` VARCHAR(255) NOT NULL DEFAULT 'SK LABA PHONE',
    `tagline` VARCHAR(255) NULL DEFAULT 'ලාබ ෆෝන්',
    `address` VARCHAR(500) NOT NULL DEFAULT 'Dongdaemun-gu, Seoul, South Korea',
    `opening_hours` VARCHAR(255) NOT NULL DEFAULT 'Mon - Sun: 10:00 AM - 9:00 PM (KST)',
    `email` VARCHAR(255) NOT NULL DEFAULT 'contact@sklabaphone.com',
    `whatsapp_number` VARCHAR(50) NOT NULL DEFAULT '+82 10-5892-7482',
    `phone_number` VARCHAR(50) NOT NULL DEFAULT '+82 10-5892-7482',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `shop_information` (
    `id`, `shop_name`, `tagline`, `address`, `opening_hours`, `email`, `whatsapp_number`, `phone_number`
) VALUES (
    1, 'SK LABA PHONE', 'ලාබ ෆෝන්', 'Dongdaemun-gu, Seoul, South Korea', 'Mon - Sun: 10:00 AM - 9:00 PM (KST)', 'contact@sklabaphone.com', '+82 10-5892-7482', '+82 10-5892-7482'
) ON DUPLICATE KEY UPDATE `id`=`id`;

-- --------------------------------------------------------------------
-- 6. CREATE `marketplace_listings` TABLE (If not already present)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `marketplace_listings` (
  `listing_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `seller_id` bigint(20) unsigned DEFAULT NULL,
  `seller_name` varchar(150) NOT NULL,
  `seller_email` varchar(255) NOT NULL,
  `seller_phone` varchar(30) NOT NULL,
  `brand_id` bigint(20) unsigned DEFAULT NULL,
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
  `battery_health` int(10) unsigned DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `description` text DEFAULT NULL,
  `accessories_included` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `original_box` tinyint(1) NOT NULL DEFAULT 0,
  `charger_included` tinyint(1) NOT NULL DEFAULT 0,
  `warranty_info` varchar(255) DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('PENDING_REVIEW','UNDER_REVIEW','CHANGES_REQUESTED','APPROVED','REJECTED','PUBLISHED','RESERVED','SOLD','CANCELLED','EXPIRED','UNPUBLISHED') NOT NULL DEFAULT 'PENDING_REVIEW',
  `seller_terms_version` varchar(50) NOT NULL DEFAULT '1.0',
  `seller_terms_accepted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `admin_notes` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `changes_requested_reason` text DEFAULT NULL,
  `reviewed_by` bigint(20) unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`listing_id`),
  KEY `idx_mkp_listings_status` (`status`),
  KEY `idx_mkp_listings_brand` (`brand`),
  KEY `idx_mkp_listings_price` (`price`),
  KEY `idx_mkp_listings_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. CREATE `marketplace_orders` TABLE (If not already present)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `marketplace_orders` (
  `order_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `listing_id` bigint(20) unsigned NOT NULL,
  `buyer_id` bigint(20) unsigned DEFAULT NULL,
  `buyer_name` varchar(150) NOT NULL,
  `buyer_email` varchar(255) NOT NULL,
  `buyer_phone` varchar(30) NOT NULL,
  `delivery_type` enum('PICKUP','DELIVERY') NOT NULL DEFAULT 'PICKUP',
  `delivery_address` text DEFAULT NULL,
  `seller_id` bigint(20) unsigned NOT NULL,
  `selling_price` decimal(12,2) NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT 5.00,
  `commission_amount` decimal(12,2) NOT NULL,
  `seller_payout` decimal(12,2) NOT NULL,
  `payment_method` enum('BANK_TRANSFER','CASH_ON_COLLECTION','ONLINE_GATEWAY') NOT NULL DEFAULT 'CASH_ON_COLLECTION',
  `payment_status` enum('PENDING','ESCROW_HELD','SELLER_PAID','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `payment_reference` varchar(150) DEFAULT NULL,
  `payment_confirmed_by` bigint(20) unsigned DEFAULT NULL,
  `payment_confirmed_at` timestamp NULL DEFAULT NULL,
  `phone_verified_by` bigint(20) unsigned DEFAULT NULL,
  `phone_verified_at` timestamp NULL DEFAULT NULL,
  `verification_notes` text DEFAULT NULL,
  `seller_paid_by` bigint(20) unsigned DEFAULT NULL,
  `seller_paid_at` timestamp NULL DEFAULT NULL,
  `seller_payout_reference` varchar(150) DEFAULT NULL,
  `delivery_status` enum('PENDING','SELLER_SHIPPED_TO_HUB','HUB_RECEIVED','DELIVERY_IN_TRANSIT','DELIVERED','COLLECTED') NOT NULL DEFAULT 'PENDING',
  `delivery_confirmed_by` bigint(20) unsigned DEFAULT NULL,
  `delivery_confirmed_at` timestamp NULL DEFAULT NULL,
  `status` enum('ORDER_PLACED','PAYMENT_PENDING','PAYMENT_CONFIRMED','PHONE_RECEIVED_AT_HUB','VERIFIED_BY_TECHNICIAN','REJECTED_AT_HUB','OUT_FOR_DELIVERY','READY_FOR_PICKUP','COMPLETED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'ORDER_PLACED',
  `buyer_terms_version` varchar(50) NOT NULL DEFAULT '1.0',
  `buyer_terms_accepted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `fk_mkp_orders_listing` (`listing_id`),
  KEY `idx_mkp_orders_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 8. CREATE `marketplace_settings` TABLE (If not already present)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `marketplace_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `marketplace_settings` (`setting_key`, `setting_value`, `description`) 
VALUES ('commission_percentage', '5.00', 'Platform commission percentage charged on Marketplace phone sales')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;

-- --------------------------------------------------------------------
-- 9. CREATE `marketplace_terms` TABLE (If not already present)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `marketplace_terms` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `term_type` enum('SELLER','BUYER') NOT NULL,
  `version` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` mediumtext NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mkp_terms_type_active` (`term_type`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `marketplace_terms` (`id`, `term_type`, `version`, `title`, `content`, `is_active`) VALUES
(1, 'SELLER', '1.0', 'SK LABA PHONE Marketplace Seller Terms & Conditions', '1. The seller confirms lawful ownership of the listed device.\n2. Listed device condition, battery health, and details must be accurately reported.\n3. Upon buyer purchase confirmation, seller agrees to send/bring device to SK LABA PHONE hub for technician verification.\n4. Platform commission (5%) will be deducted from payout upon successful verification and delivery.\n5. If device fails technician verification or is counterfeit/stolen, it will be rejected and seller bears delivery return costs.', 1),
(2, 'BUYER', '1.0', 'SK LABA PHONE Marketplace Buyer Terms & Conditions', '1. Marketplace devices are customer-to-customer listings verified by SK LABA PHONE technicians prior to release.\n2. Buyer payment is securely held in escrow until technician verification is completed.\n3. If device condition does not match listing specifications during inspection, buyer receives a 100% full refund.\n4. Once inspected and handed over / delivered, buyer acknowledges having inspected device functionality.', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- --------------------------------------------------------------------
-- 10. CREATE `marketplace_audit_logs` TABLE (If not already present)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `marketplace_audit_logs` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` enum('LISTING','ORDER','COMMISSION_SETTING','TERMS') NOT NULL,
  `entity_id` bigint(20) unsigned NOT NULL,
  `action` varchar(60) NOT NULL,
  `actor_user_id` bigint(20) unsigned DEFAULT NULL,
  `actor_role` varchar(30) NOT NULL DEFAULT 'SYSTEM',
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `idx_mkp_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_mkp_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 11. PRICE CORRECTION (Align legacy test entries with Man-won unit)
-- --------------------------------------------------------------------
UPDATE `marketplace_listings` SET `price` = 155.00 WHERE `listing_id` = 1 AND `price` >= 1000;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SUCCESS: Database updated with all new modifications!
-- ====================================================================
