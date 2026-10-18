-- Safari Lanka upgrade for an existing database. The application can also migrate these fields automatically.
USE safari_lanka;

ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL AFTER phone;
ALTER TABLE safari_packages ADD COLUMN IF NOT EXISTS additional_vehicle_fee DECIMAL(12,2) NULL AFTER price_per_person;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_count INT NULL AFTER total_amount;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_surcharge DECIMAL(12,2) NULL AFTER vehicle_count;

UPDATE safari_packages SET additional_vehicle_fee = price_per_person WHERE additional_vehicle_fee IS NULL;
UPDATE bookings SET vehicle_count = CEIL(visitor_count / 6.0) WHERE vehicle_count IS NULL OR vehicle_count < 1;
UPDATE bookings SET vehicle_surcharge = 0 WHERE vehicle_surcharge IS NULL;
UPDATE users SET license_number='G1234567' WHERE email='guide@safarilanka.lk' AND (license_number IS NULL OR license_number='');

-- Allow more than one vehicle/driver/guide assignment for a booking.
SET @idx = (SELECT index_name FROM information_schema.statistics
            WHERE table_schema=DATABASE() AND table_name='trip_assignments'
              AND column_name='booking_id' AND non_unique=0 AND index_name<>'PRIMARY' LIMIT 1);
SET @sql = IF(@idx IS NULL, 'SELECT 1', CONCAT('ALTER TABLE trip_assignments DROP INDEX `', REPLACE(@idx,'`','``'), '`'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2026-09 role-login and booking-date update:
-- No new columns are required. Staff role email naming and the no-same-day booking rule
-- are enforced in the Spring Boot application layer.
