-- ====================================================================
-- SK LABA PHONE WMS - CPANEL DATABASE INCREMENTAL UPDATE QUERY
-- Run this in phpMyAdmin -> SQL tab to update your existing database.
-- It will NOT delete or affect your existing phones, orders, or users.
-- ====================================================================

-- 1. Add `is_new_arrival` column to `phones` table (if not already added)
-- Note: If you already have is_new_arrival in phones, ignore any "Duplicate column" warning or run:
ALTER TABLE `phones` 
ADD COLUMN IF NOT EXISTS `is_new_arrival` TINYINT(1) NOT NULL DEFAULT 0;

-- 2. Create `giveaways` table
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

-- 3. Insert initial promotional ongoing giveaway (Optional / Safe)
INSERT INTO `giveaways` (
    `giveaway_id`, 
    `title`, 
    `short_description`, 
    `description`, 
    `thumbnail_url`, 
    `start_date`, 
    `end_date`, 
    `winner_selection_date`, 
    `status`, 
    `is_manually_closed`, 
    `winners_announced`, 
    `winners_announced_at`, 
    `winners`
) VALUES (
    1, 
    'Win a Brand New Samsung Galaxy S24 Ultra (512GB)!', 
    'Celebrate with SK Laba Phone! Enter our official promotional giveaway for your chance to win a flagship Samsung Galaxy S24 Ultra with free delivery direct from South Korea.', 
    'We are thrilled to give away a **Brand New Samsung Galaxy S24 Ultra (512GB, Titanium Gray)** to one lucky winner!\n\n#### How to Participate:\n• Step 1: Follow SK Laba Phone on Facebook and TikTok\n• Step 2: Like, share, and tag two friends on our official giveaway post\n• Step 3: Check your email on the winner announcement date\n\n#### Official Terms & Prize Delivery:\n1. 100% authentic South Korean stock with full manufacturer warranty\n2. Free insured delivery or store pickup in Seoul\n3. The winner will be notified directly via email with official shop contact details', 
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf', 
    '2026-11-01 00:00:00', 
    '2026-11-20 23:59:59', 
    '2026-11-21 12:00:00', 
    'ONGOING', 
    0, 
    0, 
    NULL, 
    NULL
) ON DUPLICATE KEY UPDATE `giveaway_id`=`giveaway_id`;

-- 4. Create `shop_information` table
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

-- 5. Seed default shop information (Safe execution)
INSERT INTO `shop_information` (
    `id`, 
    `shop_name`, 
    `tagline`, 
    `address`, 
    `opening_hours`, 
    `email`, 
    `whatsapp_number`, 
    `phone_number`
) VALUES (
    1, 
    'SK LABA PHONE', 
    'ලාබ ෆෝන්', 
    'Dongdaemun-gu, Seoul, South Korea', 
    'Mon - Sun: 10:00 AM - 9:00 PM (KST)', 
    'contact@sklabaphone.com', 
    '+82 10-5892-7482', 
    '+82 10-5892-7482'
) ON DUPLICATE KEY UPDATE `id`=`id`;

