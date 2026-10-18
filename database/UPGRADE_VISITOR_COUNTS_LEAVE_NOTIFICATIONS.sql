-- SAFARI LANKA - VISITOR COUNTS + LEAVE + NOTIFICATIONS UPGRADE
-- Apply this to an EXISTING database that already includes the Member-wise CRUD upgrade.
-- Existing bookings and legacy visitor rows are preserved.
USE safari_lanka;

-- ---------------------------------------------------------------------------
-- 1) Simplified booking visitor categories
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adult_count INT NOT NULL DEFAULT 1 AFTER visitor_count;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS child_five_to_eleven_count INT NOT NULL DEFAULT 0 AFTER adult_count;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS child_below_five_count INT NOT NULL DEFAULT 0 AFTER child_five_to_eleven_count;

-- Preserve all existing bookings by treating their current visitor count as adults.
-- This makes the new category total exactly match the old visitor_count.
UPDATE bookings
SET adult_count = visitor_count,
    child_five_to_eleven_count = 0,
    child_below_five_count = 0
WHERE adult_count + child_five_to_eleven_count + child_below_five_count <> visitor_count
   OR adult_count < 1;

-- Add validation checks only when they do not already exist.
SET @sql = (SELECT IF(COUNT(*)=0,
 'ALTER TABLE bookings ADD CONSTRAINT chk_booking_adults CHECK (adult_count >= 1)', 'SELECT 1')
 FROM information_schema.table_constraints
 WHERE table_schema=DATABASE() AND table_name='bookings' AND constraint_name='chk_booking_adults');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
 'ALTER TABLE bookings ADD CONSTRAINT chk_booking_child_5_11 CHECK (child_five_to_eleven_count >= 0)', 'SELECT 1')
 FROM information_schema.table_constraints
 WHERE table_schema=DATABASE() AND table_name='bookings' AND constraint_name='chk_booking_child_5_11');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
 'ALTER TABLE bookings ADD CONSTRAINT chk_booking_child_below_5 CHECK (child_below_five_count >= 0)', 'SELECT 1')
 FROM information_schema.table_constraints
 WHERE table_schema=DATABASE() AND table_name='bookings' AND constraint_name='chk_booking_child_below_5');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
 'ALTER TABLE bookings ADD CONSTRAINT chk_booking_group_total CHECK (visitor_count = adult_count + child_five_to_eleven_count + child_below_five_count)', 'SELECT 1')
 FROM information_schema.table_constraints
 WHERE table_schema=DATABASE() AND table_name='bookings' AND constraint_name='chk_booking_group_total');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2) Guide/driver leave requests with Admin review
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_requests (
    id                 BIGINT NOT NULL AUTO_INCREMENT,
    requester_id       BIGINT NOT NULL,
    start_date         DATE NOT NULL,
    end_date           DATE NOT NULL,
    note               VARCHAR(1000) NOT NULL,
    status             VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    admin_note         VARCHAR(1000) NULL,
    reviewed_by_email  VARCHAR(255) NULL,
    reviewed_at        DATETIME(6) NULL,
    created_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_leave_requester FOREIGN KEY (requester_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_leave_status CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 3) Notifications / messages for every login
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    recipient_id  BIGINT NOT NULL,
    sender_id     BIGINT NULL,
    title         VARCHAR(180) NOT NULL,
    message       VARCHAR(2500) NOT NULL,
    category      VARCHAR(60) NOT NULL DEFAULT 'SYSTEM',
    read_flag     TINYINT(1) NOT NULL DEFAULT 0,
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_notification_sender FOREIGN KEY (sender_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Optional indexes (created only if missing).
SET @sql = (SELECT IF(COUNT(*)=0,
 'CREATE INDEX idx_leave_requester ON leave_requests(requester_id)', 'SELECT 1')
 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='leave_requests' AND index_name='idx_leave_requester');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
 'CREATE INDEX idx_leave_dates ON leave_requests(start_date,end_date)', 'SELECT 1')
 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='leave_requests' AND index_name='idx_leave_dates');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
 'CREATE INDEX idx_leave_status ON leave_requests(status)', 'SELECT 1')
 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='leave_requests' AND index_name='idx_leave_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
 'CREATE INDEX idx_notification_recipient_created ON notifications(recipient_id,created_at)', 'SELECT 1')
 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='notifications' AND index_name='idx_notification_recipient_created');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
 'CREATE INDEX idx_notification_unread ON notifications(recipient_id,read_flag)', 'SELECT 1')
 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='notifications' AND index_name='idx_notification_unread');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
 'CREATE INDEX idx_notification_category ON notifications(category)', 'SELECT 1')
 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='notifications' AND index_name='idx_notification_category');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Notes:
-- * The legacy visitors table is intentionally NOT dropped; old booking records remain intact.
-- * New booking creation no longer inserts visitor PII rows.
-- * Driving-licence validation is application-level and needs no schema change.
-- * Driver trip completion uses existing permit.checked_out_at/status fields, so no new column is needed.
