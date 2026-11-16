-- Migration: 010_optimize_phone_indexes.sql
-- Optimizes Smartphone listing, storefront filtering, and stock queries

ALTER TABLE phones
    ADD INDEX idx_phones_storefront (is_archived, status, product_source, phone_id),
    ADD INDEX idx_phones_availability (availability),
    ADD INDEX idx_phones_condition (phone_condition),
    ADD INDEX idx_phones_new_arrival (is_new_arrival);
