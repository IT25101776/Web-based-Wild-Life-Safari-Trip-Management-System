-- SAFARI LANKA - MEMBER-WISE CRUD UPGRADE
-- Safe upgrade for an existing safari_lanka database.
USE safari_lanka;

-- Staff account soft-delete / restore support.
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_at DATETIME(6) NULL;

-- Guide Roster CRUD (Member 4)
CREATE TABLE IF NOT EXISTS guide_rosters (
    id BIGINT NOT NULL AUTO_INCREMENT,
    guide_id BIGINT NOT NULL,
    roster_date DATE NOT NULL,
    shift VARCHAR(30) NOT NULL,
    available TINYINT(1) NOT NULL DEFAULT 1,
    notes VARCHAR(500) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_guide_roster_slot UNIQUE (guide_id, roster_date, shift),
    CONSTRAINT fk_guide_roster_guide FOREIGN KEY (guide_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_guide_roster_shift CHECK (shift IN ('MORNING','AFTERNOON','FULL_DAY'))
) ENGINE=InnoDB;

-- Park Compliance (Member 6) - database table/API names retained for compatibility
CREATE TABLE IF NOT EXISTS gate_compliance_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    permit_id BIGINT NOT NULL,
    officer_id BIGINT NOT NULL,
    gate_name VARCHAR(255) NOT NULL,
    vehicle_registration VARCHAR(255) NULL,
    inspection_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    permit_verified TINYINT(1) NOT NULL DEFAULT 0,
    visitor_count_verified TINYINT(1) NOT NULL DEFAULT 0,
    vehicle_verified TINYINT(1) NOT NULL DEFAULT 0,
    guide_verified TINYINT(1) NOT NULL DEFAULT 0,
    driver_verified TINYINT(1) NOT NULL DEFAULT 0,
    compliance_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    record_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes VARCHAR(1500) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_gate_compliance_permit FOREIGN KEY (permit_id) REFERENCES permits(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_gate_compliance_officer FOREIGN KEY (officer_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_gate_compliance_status CHECK (compliance_status IN ('PENDING','PASSED','ISSUE_FOUND')),
    CONSTRAINT chk_gate_record_status CHECK (record_status IN ('DRAFT','FINALIZED'))
) ENGINE=InnoDB;

-- Refund CRUD includes safe withdrawal instead of hard deleting finance history.
-- MySQL may have the old check constraint; replace it if present.
SET @drop_refund_check = (
    SELECT IF(COUNT(*)>0,'ALTER TABLE refund_requests DROP CHECK chk_refund_status','SELECT 1')
    FROM information_schema.table_constraints
    WHERE table_schema=DATABASE() AND table_name='refund_requests'
      AND constraint_type='CHECK' AND constraint_name='chk_refund_status'
);
PREPARE stmt FROM @drop_refund_check; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE refund_requests
    ADD CONSTRAINT chk_refund_status
    CHECK (status IN ('PENDING','APPROVED','REJECTED','PROCESSED','WITHDRAWN'));

-- Notes:
-- Member 1 Booking CRUD reuses existing bookings/visitors tables.
-- Member 2 Package CRUD already uses safari_packages.
-- Member 3 Maintenance CRUD reuses maintenance_records.
-- Member 5 Refund CRUD reuses refund_requests and adds WITHDRAWN state.
-- Vehicle delete and staff delete are soft-delete/archive operations to preserve history.
