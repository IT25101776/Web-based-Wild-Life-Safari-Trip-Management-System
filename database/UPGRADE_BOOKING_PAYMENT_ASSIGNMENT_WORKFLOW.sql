-- Safari Lanka upgrade: booking confirmation/payment workflow, reasons and assignment support
-- Date: 2026-10-09
-- MySQL 8+
USE safari_lanka;

-- 1) Persist booking cancellation reason.
SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='bookings' AND column_name='cancellation_reason'),
    'SELECT 1',
    'ALTER TABLE bookings ADD COLUMN cancellation_reason VARCHAR(1000) NULL AFTER special_requirements'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Persist finance payment rejection reason.
SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='payments' AND column_name='rejection_reason'),
    'SELECT 1',
    'ALTER TABLE payments ADD COLUMN rejection_reason VARCHAR(1000) NULL AFTER review_note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Allow REJECTED payment status on bookings.
SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema=DATABASE() AND table_name='bookings' AND constraint_type='CHECK' AND constraint_name='chk_booking_payment_status'),
    'ALTER TABLE bookings DROP CHECK chk_booking_payment_status',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE bookings
    ADD CONSTRAINT chk_booking_payment_status CHECK (
        payment_status IN ('UNPAID','PENDING','PAID','REJECTED','FAILED','REFUNDED')
    );

-- 4) Allow REJECTED on individual payments.
SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema=DATABASE() AND table_name='payments' AND constraint_type='CHECK' AND constraint_name='chk_payment_status'),
    'ALTER TABLE payments DROP CHECK chk_payment_status',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE payments
    ADD CONSTRAINT chk_payment_status CHECK (
        status IN ('UNPAID','PENDING','PAID','REJECTED','FAILED','REFUNDED')
    );

-- 5) Keep visitor age validation aligned with the UI: 1-99 only.
SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema=DATABASE() AND table_name='visitors' AND constraint_type='CHECK' AND constraint_name='chk_visitor_age'),
    'ALTER TABLE visitors DROP CHECK chk_visitor_age',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE visitors
    ADD CONSTRAINT chk_visitor_age CHECK (age IS NULL OR (age >= 1 AND age <= 99));

-- Driver-to-vehicle assignment uses the existing vehicles.driver_id foreign key.
-- No additional relationship table is required. The application enforces one current
-- vehicle per driver and prevents same-date conflicts for drivers, guides and vehicles.
