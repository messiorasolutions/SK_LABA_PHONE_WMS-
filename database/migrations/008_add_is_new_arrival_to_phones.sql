-- Migration: 008_add_is_new_arrival_to_phones.sql
-- Description: Add is_new_arrival flag to phones table for highlighting and filtering new arrivals.

ALTER TABLE phones
ADD COLUMN is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE AFTER is_archived;

