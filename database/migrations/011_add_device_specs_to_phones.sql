-- Migration: 011_add_device_specs_to_phones.sql
-- Description: Add is_genuine_battery, is_original_housing, and display_size to phones table

ALTER TABLE phones
MODIFY COLUMN battery_health VARCHAR(50) NULL DEFAULT NULL,
ADD COLUMN is_genuine_battery BOOLEAN NOT NULL DEFAULT TRUE AFTER battery_health,
ADD COLUMN is_original_housing BOOLEAN NOT NULL DEFAULT TRUE AFTER is_genuine_battery,
ADD COLUMN display_size VARCHAR(50) NULL DEFAULT NULL AFTER is_original_housing;
