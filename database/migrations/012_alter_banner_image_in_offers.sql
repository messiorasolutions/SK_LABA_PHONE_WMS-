-- ============================================================
-- Migration: 012_alter_banner_image_in_offers.sql
-- Description: Allow long base64/data URLs or long file paths for offer banner images
-- ============================================================

ALTER TABLE offers
MODIFY COLUMN banner_image LONGTEXT NULL;
