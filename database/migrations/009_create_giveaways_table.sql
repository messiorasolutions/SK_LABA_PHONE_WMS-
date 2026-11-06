-- ============================================================
-- Migration: 009_create_giveaways_table.sql
-- Description: Create giveaways table for Giveaway Management
-- ============================================================

CREATE TABLE IF NOT EXISTS giveaways (
    giveaway_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_description VARCHAR(500) NULL,
    description LONGTEXT NULL,
    thumbnail_url LONGTEXT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    winner_selection_date DATETIME NOT NULL,
    status ENUM('DRAFT', 'ONGOING', 'COMPLETED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    is_manually_closed BOOLEAN NOT NULL DEFAULT FALSE,
    winners_announced BOOLEAN NOT NULL DEFAULT FALSE,
    winners_announced_at DATETIME NULL,
    winners JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_giveaway_status (status),
    INDEX idx_giveaway_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

