-- ============================================================================
-- SAFARI LANKA - WEB BASED WILDLIFE SAFARI TRIP MANAGEMENT SYSTEM
-- SE2030 Software Engineering - Year 2 Semester 1 - 2026
-- Yala National Park Academic Prototype
--
-- FULL MYSQL 8 / MYSQL WORKBENCH DATABASE SCRIPT
-- Backend compatibility: Java 17 + Spring Boot + Spring Data JPA/Hibernate
-- Database used by application: safari_lanka
-- MySQL application login expected by application.properties: root / 1234
--
-- IMPORTANT:
--   This is a CLEAN-INSTALL script. It DROPS the existing safari_lanka database
--   and recreates it with all tables, constraints, indexes, views and demo data.
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+05:30';
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS safari_lanka;
CREATE DATABASE safari_lanka
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE safari_lanka;

-- ============================================================================
-- 1. USERS / ROLE-BASED ACCESS
-- Roles used by the Spring Boot application:
-- TOURIST, SAFARI_OPERATOR, SAFARI_GUIDE, JEEP_DRIVER,
-- PARK_OFFICER, FINANCE_MANAGER, SYSTEM_ADMIN
-- ============================================================================
CREATE TABLE users (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL,
    phone           VARCHAR(50) NULL,
    address         VARCHAR(500) NULL,
    country         VARCHAR(120) NULL,
    preferred_currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
    preferred_language VARCHAR(20) NOT NULL DEFAULT 'ENGLISH',
    gender          VARCHAR(30) NULL,
    birth_date      DATE NULL,
    identity_type   VARCHAR(20) NULL,
    identity_number VARCHAR(40) NULL,
    active          TINYINT(1) NOT NULL DEFAULT 1,
    available       TINYINT(1) NOT NULL DEFAULT 1,
    on_leave        TINYINT(1) NOT NULL DEFAULT 0,
    archived        TINYINT(1) NOT NULL DEFAULT 0,
    archived_at     DATETIME(6) NULL,
    qualifications  VARCHAR(255) NULL,
    languages       VARCHAR(255) NULL,
    license_number  VARCHAR(255) NULL,
    profile_image_url VARCHAR(1000) NULL,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_gender CHECK (gender IS NULL OR gender IN ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY')),
    CONSTRAINT chk_users_identity_type CHECK (identity_type IS NULL OR identity_type IN ('NIC','PASSPORT')),
    CONSTRAINT chk_users_role CHECK (
        role IN ('TOURIST','SAFARI_OPERATOR','SAFARI_GUIDE','JEEP_DRIVER',
                 'PARK_OFFICER','FINANCE_MANAGER','SYSTEM_ADMIN')
    )
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_available ON users(available, on_leave);


-- ============================================================================
-- STAFF LEAVE REQUESTS / NOTIFICATIONS & MESSAGING
-- ============================================================================
CREATE TABLE leave_requests (
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
CREATE INDEX idx_leave_requester ON leave_requests(requester_id);
CREATE INDEX idx_leave_dates ON leave_requests(start_date,end_date);
CREATE INDEX idx_leave_status ON leave_requests(status);

CREATE TABLE notifications (
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
CREATE INDEX idx_notification_recipient_created ON notifications(recipient_id,created_at);
CREATE INDEX idx_notification_unread ON notifications(recipient_id,read_flag);
CREATE INDEX idx_notification_category ON notifications(category);

-- ============================================================================
-- STAFF ACCOUNT NAME / ROLE-EMAIL CHANGE REQUESTS
-- ============================================================================
CREATE TABLE account_change_requests (
    id                    BIGINT NOT NULL AUTO_INCREMENT,
    requester_id          BIGINT NOT NULL,
    current_full_name     VARCHAR(255) NOT NULL,
    current_email         VARCHAR(255) NOT NULL,
    requested_full_name   VARCHAR(255) NOT NULL,
    requested_email       VARCHAR(255) NOT NULL,
    status                VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    admin_note            VARCHAR(1000) NULL,
    reviewed_by_email     VARCHAR(255) NULL,
    reviewed_at           DATETIME(6) NULL,
    created_at            DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_account_change_requester FOREIGN KEY (requester_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_account_change_status CHECK (status IN ('PENDING','APPROVED','REJECTED'))
) ENGINE=InnoDB;
CREATE INDEX idx_account_change_requester ON account_change_requests(requester_id,created_at);
CREATE INDEX idx_account_change_status ON account_change_requests(status);

-- ============================================================================
-- 2. SAFARI PACKAGE / ROUTE / TIME SLOT / PRICING MANAGEMENT
-- ============================================================================
CREATE TABLE safari_packages (
    id                BIGINT NOT NULL AUTO_INCREMENT,
    name              VARCHAR(255) NOT NULL,
    description       VARCHAR(1800) NULL,
    route_zone        VARCHAR(255) NULL,
    time_slot         VARCHAR(255) NULL,
    price_per_person  DECIMAL(12,2) NOT NULL,
    additional_vehicle_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_visitors      INT NOT NULL,
    max_vehicles      INT NOT NULL,
    published         TINYINT(1) NOT NULL DEFAULT 1,
    deleted           TINYINT(1) NOT NULL DEFAULT 0,
    image_url         VARCHAR(1000) NULL,
    video_url         VARCHAR(1000) NULL,
    duration          VARCHAR(255) NULL,
    created_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_safari_packages_name UNIQUE (name),
    CONSTRAINT chk_package_price CHECK (price_per_person >= 0),
    CONSTRAINT chk_package_visitors CHECK (max_visitors > 0),
    CONSTRAINT chk_package_vehicles CHECK (max_vehicles > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_packages_published ON safari_packages(published);
CREATE INDEX idx_packages_deleted ON safari_packages(deleted);
CREATE INDEX idx_packages_route ON safari_packages(route_zone);

-- ============================================================================
-- 3. TOURIST BOOKING / VISITOR GROUP / PERMIT APPLICATION FOUNDATION
-- ============================================================================

-- PRICING POLICY (2026-10-15)
-- Children below 5 years are free of the package per-person charge.
-- They still count in visitor_count and therefore still affect the 6-person vehicle capacity
-- and any additional-vehicle surcharge. total_amount is calculated and stored by the backend as:
--   (adult_count + child_five_to_eleven_count) * package.price_per_person + vehicle_surcharge
-- No schema migration is required for this policy because the visitor age-group columns already exist.

CREATE TABLE bookings (
    id                    BIGINT NOT NULL AUTO_INCREMENT,
    booking_code          VARCHAR(255) NOT NULL,
    tourist_id            BIGINT NOT NULL,
    safari_package_id     BIGINT NOT NULL,
    visit_date            DATE NOT NULL,
    visitor_count         INT NOT NULL,
    adult_count           INT NOT NULL DEFAULT 1,
    child_five_to_eleven_count INT NOT NULL DEFAULT 0,
    child_below_five_count INT NOT NULL DEFAULT 0, -- counts toward capacity; free of the per-person package charge
    group_leader_name     VARCHAR(255) NULL,
    contact_phone         VARCHAR(255) NULL,
    emergency_contact     VARCHAR(255) NULL,
    special_requirements  VARCHAR(1500) NULL,
    cancellation_reason   VARCHAR(1000) NULL,
    booking_status        VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_status        VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    total_amount          DECIMAL(12,2) NOT NULL,
    vehicle_count         INT NOT NULL DEFAULT 1,
    vehicle_surcharge     DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at            DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_bookings_code UNIQUE (booking_code),
    CONSTRAINT fk_bookings_tourist
        FOREIGN KEY (tourist_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_package
        FOREIGN KEY (safari_package_id) REFERENCES safari_packages(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_booking_visitors CHECK (visitor_count > 0),
    CONSTRAINT chk_booking_adults CHECK (adult_count >= 1),
    CONSTRAINT chk_booking_child_5_11 CHECK (child_five_to_eleven_count >= 0),
    CONSTRAINT chk_booking_child_below_5 CHECK (child_below_five_count >= 0),
    CONSTRAINT chk_booking_group_total CHECK (visitor_count = adult_count + child_five_to_eleven_count + child_below_five_count),
    CONSTRAINT chk_booking_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_booking_status CHECK (
        booking_status IN ('PENDING','CONFIRMED','REJECTED','CANCELLED','COMPLETED')
    ),
    CONSTRAINT chk_booking_payment_status CHECK (
        payment_status IN ('UNPAID','PENDING','PAID','REJECTED','FAILED','REFUNDED')
    )
) ENGINE=InnoDB;

CREATE INDEX idx_bookings_tourist ON bookings(tourist_id);
CREATE INDEX idx_bookings_package_date ON bookings(safari_package_id, visit_date);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_visit_date ON bookings(visit_date);

-- Legacy individual visitor records are preserved for historical bookings.
-- New bookings use category counts on bookings and do not require visitor PII.
CREATE TABLE visitors (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    booking_id   BIGINT NOT NULL,
    full_name    VARCHAR(255) NOT NULL,
    id_type      VARCHAR(20) NOT NULL DEFAULT 'NIC',
    id_number    VARCHAR(255) NULL,
    nationality  VARCHAR(255) NULL,
    age          INT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_visitors_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_visitor_age CHECK (age IS NULL OR (age >= 1 AND age <= 99)),
    CONSTRAINT chk_visitor_id_type CHECK (id_type IN ('NIC','PASSPORT'))
) ENGINE=InnoDB;

CREATE INDEX idx_visitors_booking ON visitors(booking_id);
CREATE INDEX idx_visitors_id_number ON visitors(id_number);

-- ============================================================================
-- 4. JEEP DRIVER / VEHICLE / MAINTENANCE MANAGEMENT
-- ============================================================================
CREATE TABLE vehicles (
    id                    BIGINT NOT NULL AUTO_INCREMENT,
    registration_no       VARCHAR(255) NOT NULL,
    model                 VARCHAR(255) NULL,
    capacity              INT NOT NULL,
    status                VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    document_valid_until  DATE NULL,
    driver_id             BIGINT NULL,
    created_at            DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_vehicle_registration UNIQUE (registration_no),
    CONSTRAINT fk_vehicle_driver
        FOREIGN KEY (driver_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_vehicle_capacity CHECK (capacity > 0),
    CONSTRAINT chk_vehicle_status CHECK (
        status IN ('AVAILABLE','ASSIGNED','MAINTENANCE','INACTIVE')
    )
) ENGINE=InnoDB;

CREATE INDEX idx_vehicle_driver ON vehicles(driver_id);
CREATE INDEX idx_vehicle_status ON vehicles(status);

CREATE TABLE maintenance_records (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    vehicle_id    BIGINT NOT NULL,
    service_date  DATE NOT NULL,
    description   VARCHAR(1000) NULL,
    status        VARCHAR(255) NULL,
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_maintenance_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_service_date ON maintenance_records(service_date);

-- ============================================================================
-- 5. PAYMENT / INVOICE / CANCELLATION / REFUND MANAGEMENT
-- ============================================================================
CREATE TABLE payments (
    id                     BIGINT NOT NULL AUTO_INCREMENT,
    payment_code           VARCHAR(255) NOT NULL,
    booking_id             BIGINT NOT NULL,
    amount                 DECIMAL(12,2) NOT NULL,
    method                 VARCHAR(50) NOT NULL,
    status                 VARCHAR(50) NOT NULL,
    transaction_reference  VARCHAR(255) NULL,
    invoice_number         VARCHAR(255) NULL,
    card_brand             VARCHAR(50) NULL,
    card_last4             VARCHAR(4) NULL,
    bank_slip_file_name    VARCHAR(255) NULL,
    bank_slip_path         VARCHAR(1000) NULL,
    review_note            VARCHAR(1000) NULL,
    rejection_reason       VARCHAR(1000) NULL,
    reviewed_by            VARCHAR(255) NULL,
    reviewed_at            DATETIME(6) NULL,
    paid_at                DATETIME(6) NULL,
    created_at             DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_payments_code UNIQUE (payment_code),
    CONSTRAINT uk_invoice_number UNIQUE (invoice_number),
    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_payment_amount CHECK (amount >= 0),
    CONSTRAINT chk_payment_method CHECK (
        method IN ('CARD','BANK_TRANSFER','MOBILE_WALLET','CASH_AT_COUNTER')
    ),
    CONSTRAINT chk_payment_status CHECK (
        status IN ('UNPAID','PENDING','PAID','REJECTED','FAILED','REFUNDED')
    )
) ENGINE=InnoDB;

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

CREATE TABLE refund_requests (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    booking_id     BIGINT NOT NULL,
    payment_id     BIGINT NOT NULL,
    amount         DECIMAL(12,2) NOT NULL,
    reason         VARCHAR(1000) NULL,
    status         VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    decision_note  VARCHAR(255) NULL,
    created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    decided_at     DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_refund_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_refund_payment
        FOREIGN KEY (payment_id) REFERENCES payments(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_refund_amount CHECK (amount >= 0),
    CONSTRAINT chk_refund_status CHECK (
        status IN ('PENDING','APPROVED','REJECTED','PROCESSED','WITHDRAWN')
    )
) ENGINE=InnoDB;

CREATE INDEX idx_refund_booking ON refund_requests(booking_id);
CREATE INDEX idx_refund_payment ON refund_requests(payment_id);
CREATE INDEX idx_refund_status ON refund_requests(status);

-- ============================================================================
-- 6. PARK ENTRY / DIGITAL PERMIT / SAFARI COMPLIANCE MANAGEMENT
-- ============================================================================
CREATE TABLE permits (
    id               BIGINT NOT NULL AUTO_INCREMENT,
    permit_code      VARCHAR(255) NOT NULL,
    booking_id       BIGINT NOT NULL,
    status           VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    gate_name        VARCHAR(255) NULL DEFAULT 'Yala Palatupana Gate',
    decision_reason  VARCHAR(1000) NULL,
    decision_by_email VARCHAR(255) NULL,
    decision_by_name  VARCHAR(255) NULL,
    decision_by_role  VARCHAR(80) NULL,
    checked_in_by_email VARCHAR(255) NULL,
    checked_out_by_email VARCHAR(255) NULL,
    issued_at        DATETIME(6) NULL,
    checked_in_at    DATETIME(6) NULL,
    checked_out_at   DATETIME(6) NULL,
    created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_permits_code UNIQUE (permit_code),
    CONSTRAINT uk_permits_booking UNIQUE (booking_id),
    CONSTRAINT fk_permits_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_permit_status CHECK (
        status IN ('PENDING','APPROVED','REJECTED','CHECKED_IN','COMPLETED','VOID')
    )
) ENGINE=InnoDB;

CREATE INDEX idx_permits_status ON permits(status);
CREATE INDEX idx_permits_gate ON permits(gate_name);

-- ============================================================================
-- 7. SAFARI GUIDE ROSTER / DRIVER + VEHICLE + GUIDE TRIP ASSIGNMENT
-- ============================================================================
CREATE TABLE trip_assignments (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    booking_id   BIGINT NOT NULL,
    vehicle_id   BIGINT NOT NULL,
    driver_id    BIGINT NOT NULL,
    guide_id     BIGINT NOT NULL,
    status       VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    assigned_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_assignment_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_assignment_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_assignment_driver
        FOREIGN KEY (driver_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_assignment_guide
        FOREIGN KEY (guide_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_assignment_status CHECK (
        status IN ('ASSIGNED','ACCEPTED','DECLINED','IN_PROGRESS','COMPLETED','CANCELLED')
    )
) ENGINE=InnoDB;

CREATE INDEX idx_assignment_vehicle ON trip_assignments(vehicle_id);
CREATE INDEX idx_assignment_driver ON trip_assignments(driver_id);
CREATE INDEX idx_assignment_guide ON trip_assignments(guide_id);
CREATE INDEX idx_assignment_status ON trip_assignments(status);

CREATE TABLE guide_rosters (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    guide_id     BIGINT NOT NULL,
    roster_date  DATE NOT NULL,
    shift        VARCHAR(30) NOT NULL,
    available    TINYINT(1) NOT NULL DEFAULT 1,
    notes        VARCHAR(500) NULL,
    created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_guide_roster_slot UNIQUE (guide_id, roster_date, shift),
    CONSTRAINT fk_guide_roster_guide FOREIGN KEY (guide_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_guide_roster_shift CHECK (shift IN ('MORNING','AFTERNOON','FULL_DAY'))
) ENGINE=InnoDB;

CREATE INDEX idx_guide_roster_date ON guide_rosters(roster_date);
CREATE INDEX idx_guide_roster_guide ON guide_rosters(guide_id);

CREATE TABLE gate_compliance_records (
    id                     BIGINT NOT NULL AUTO_INCREMENT,
    permit_id              BIGINT NOT NULL,
    officer_id             BIGINT NOT NULL,
    gate_name              VARCHAR(255) NOT NULL,
    vehicle_registration   VARCHAR(255) NULL,
    inspection_date        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    permit_verified        TINYINT(1) NOT NULL DEFAULT 0,
    visitor_count_verified TINYINT(1) NOT NULL DEFAULT 0,
    vehicle_verified       TINYINT(1) NOT NULL DEFAULT 0,
    guide_verified         TINYINT(1) NOT NULL DEFAULT 0,
    driver_verified        TINYINT(1) NOT NULL DEFAULT 0,
    compliance_status      VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    record_status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes                  VARCHAR(1500) NULL,
    created_at             DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at             DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_gate_compliance_permit FOREIGN KEY (permit_id) REFERENCES permits(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_gate_compliance_officer FOREIGN KEY (officer_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_gate_compliance_status CHECK (compliance_status IN ('PENDING','PASSED','ISSUE_FOUND')),
    CONSTRAINT chk_gate_record_status CHECK (record_status IN ('DRAFT','FINALIZED'))
) ENGINE=InnoDB;

CREATE INDEX idx_gate_compliance_permit ON gate_compliance_records(permit_id);
CREATE INDEX idx_gate_compliance_officer ON gate_compliance_records(officer_id);
CREATE INDEX idx_gate_compliance_record_status ON gate_compliance_records(record_status);

-- ============================================================================
-- 8. SAFARI INCIDENT / COMPLIANCE RECORDS
-- ============================================================================
CREATE TABLE incidents (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    booking_id   BIGINT NOT NULL,
    reporter_id  BIGINT NOT NULL,
    type         VARCHAR(255) NULL,
    details      VARCHAR(1800) NULL,
    status       VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_incident_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_reporter
        FOREIGN KEY (reporter_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_incident_status CHECK (
        status IN ('OPEN','REVIEWING','RESOLVED')
    )
) ENGINE=InnoDB;

CREATE INDEX idx_incidents_booking ON incidents(booking_id);
CREATE INDEX idx_incidents_reporter ON incidents(reporter_id);
CREATE INDEX idx_incidents_status ON incidents(status);

-- ============================================================================
-- 9. VERIFIED TOURIST REVIEWS / EXPERIENCE MEDIA
-- Reviews are accepted by the application only after a safari booking is completed.
-- ============================================================================
CREATE TABLE reviews (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    booking_id      BIGINT NOT NULL,
    tourist_id      BIGINT NOT NULL,
    package_id      BIGINT NOT NULL,
    overall_rating  INT NOT NULL,
    driver_rating   INT NULL,
    guide_rating    INT NULL,
    title           VARCHAR(180) NULL,
    review_text     VARCHAR(4000) NOT NULL,
    driver_review   VARCHAR(2000) NULL,
    guide_review    VARCHAR(2000) NULL,
    media_urls      LONGTEXT NULL,
    published       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_review_booking UNIQUE (booking_id),
    CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_review_tourist FOREIGN KEY (tourist_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_review_package FOREIGN KEY (package_id) REFERENCES safari_packages(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_review_overall CHECK (overall_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_review_driver CHECK (driver_rating IS NULL OR driver_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_review_guide CHECK (guide_rating IS NULL OR guide_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE INDEX idx_reviews_published ON reviews(published, created_at);
CREATE INDEX idx_reviews_tourist ON reviews(tourist_id);
CREATE INDEX idx_reviews_package ON reviews(package_id);


-- ============================================================================
-- 10. PUBLIC CONTACT / SUPPORT REQUESTS
-- ============================================================================
CREATE TABLE contact_messages (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(180) NOT NULL,
    phone         VARCHAR(30) NULL,
    booking_code  VARCHAR(40) NULL,
    subject       VARCHAR(160) NOT NULL,
    message       VARCHAR(3000) NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'NEW',
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT chk_contact_status CHECK (status IN ('NEW','READ','RESOLVED'))
) ENGINE=InnoDB;

CREATE INDEX idx_contact_status ON contact_messages(status);
CREATE INDEX idx_contact_created ON contact_messages(created_at);
CREATE INDEX idx_contact_booking ON contact_messages(booking_code);

-- ============================================================================
-- 11. SYSTEM ADMIN SETTINGS + AUDIT LOGS
-- ============================================================================
CREATE TABLE system_settings (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    setting_key    VARCHAR(255) NOT NULL,
    setting_value  VARCHAR(2000) NULL,
    description    VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_system_setting_key UNIQUE (setting_key)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    actor_email  VARCHAR(255) NULL,
    action       VARCHAR(255) NULL,
    details      VARCHAR(2000) NULL,
    created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE INDEX idx_audit_actor ON audit_logs(actor_email);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

-- ============================================================================
-- DEFAULT 7 LOGIN ACCOUNTS
-- Passwords are BCrypt hashes and are compatible with Spring Security.
--
-- Tourist   : tourist@safarilanka.lk  / Tourist@123
-- Operator  : operator@safarilanka.lk / Operator@123
-- Guide     : guide@safarilanka.lk    / Guide@123
-- Driver    : driver@safarilanka.lk   / Driver@123
-- Park      : park@safarilanka.lk     / Park@123
-- Finance   : finance@safarilanka.lk  / Finance@123
-- Admin     : admin@safarilanka.lk    / Admin@123
-- ============================================================================
INSERT INTO users
(id, full_name, email, password, role, phone, address, country, preferred_currency, preferred_language, gender, birth_date, identity_type, identity_number,
 active, available, on_leave, qualifications, languages, license_number, created_at)
VALUES
(1, 'Demo Tourist',
 'tourist@safarilanka.lk',
 '$2y$10$Ov97V12AIIPgA2Hxe.CMMO.TY5XC45KEWvIGQwxIM16qCvqWPu2MS',
 'TOURIST', '0771000001', 'Colombo, Sri Lanka', 'Sri Lanka', 'LKR', 'ENGLISH', 'MALE', '2004-01-01', 'NIC', '200012345678', 1, 1, 0, NULL, NULL, NULL, CURRENT_TIMESTAMP(6)),

(2, 'Safari Operations Manager',
 'operator@safarilanka.lk',
 '$2y$10$JlR9qW8yXLOa5AJfHKPre.ih/4Xtg5i8Ftixu9RFzW8NjZgnGSAv.',
 'SAFARI_OPERATOR', '0771000002', NULL, NULL, 'LKR', 'ENGLISH', NULL, NULL, NULL, NULL, 1, 1, 0, NULL, NULL, NULL, CURRENT_TIMESTAMP(6)),

(3, 'Senior Safari Guide',
 'guide@safarilanka.lk',
 '$2y$10$PvzV0CQFMMMTbmeLPYVuVOwJR5gIKcdLAeGKsoSLKUJ4YjGhIJWB6',
 'SAFARI_GUIDE', '0771000003', NULL, NULL, 'LKR', 'ENGLISH', NULL, NULL, NULL, NULL, 1, 1, 0,
 'Certified Naturalist; First Aid; Yala Block I experience',
 'English, Sinhala', NULL, CURRENT_TIMESTAMP(6)),

(4, 'Yala Jeep Driver',
 'driver@safarilanka.lk',
 '$2y$10$2TkQMn8Uecpe3NFWZLvEfOep4GMw/x9BTIqWLqRBEJExb/UonJm6W',
 'JEEP_DRIVER', '0771000004', NULL, NULL, 'LKR', 'ENGLISH', NULL, NULL, NULL, NULL, 1, 1, 0,
 NULL, NULL, 'B1234567', CURRENT_TIMESTAMP(6)),

(5, 'Authorized Park Gate Officer',
 'park@safarilanka.lk',
 '$2y$10$Vsame3ECX8IGD9o155.M/.EKiIZwL1LgcxoXm3B72jIS791Zi2thK',
 'PARK_OFFICER', '0771000005', NULL, NULL, 'LKR', 'ENGLISH', NULL, NULL, NULL, NULL, 1, 1, 0, NULL, NULL, NULL, CURRENT_TIMESTAMP(6)),

(6, 'Finance & Administration Manager',
 'finance@safarilanka.lk',
 '$2y$10$G4UoZJThm9nINm/pzBt5jelWhYF1E8CgrKty5LfNmAYlfUXZ2.OqC',
 'FINANCE_MANAGER', '0771000006', NULL, NULL, 'LKR', 'ENGLISH', NULL, NULL, NULL, NULL, 1, 1, 0, NULL, NULL, NULL, CURRENT_TIMESTAMP(6)),

(7, 'System Administrator',
 'admin@safarilanka.lk',
 '$2y$10$3N7763GMX/IzBgweMui51uvml86sSvUBy0ue/.sz0b0c1NhWDHvdS',
 'SYSTEM_ADMIN', '0771000007', NULL, NULL, 'LKR', 'ENGLISH', NULL, NULL, NULL, NULL, 1, 1, 0, NULL, NULL, NULL, CURRENT_TIMESTAMP(6));

-- ============================================================================
-- ADMIN-CREATED STAFF LOGIN EMAIL POLICY (enforced by the application)
-- Safari Operator:     name@operator.safarilanka.lk
-- Safari Guide:        name@guide.safarilanka.lk
-- Jeep Driver:         name@driver.safarilanka.lk
-- Park / Gate Officer: name@park.safarilanka.lk
-- Finance Manager:     name@finance.safarilanka.lk
-- System Administrator:name@admin.safarilanka.lk
-- Tourist accounts continue to use the public registration page and their own email address.

-- YALA SAFARI PACKAGE DEMO DATA
-- ============================================================================
INSERT INTO safari_packages
(id, name, description, route_zone, time_slot, price_per_person, additional_vehicle_fee,
 max_visitors, max_vehicles, published, image_url, video_url, duration, created_at)
VALUES
(1,
 'Yala Dawn Leopard Quest',
 'Early-morning safari focused on Yala Block I habitats and responsible leopard observation.',
 'Block I - Palatupana', '05:30 - 10:30', 12500.00, 12500.00, 24, 4, 1,
 '/images/packages/yala-dawn-leopard-quest.png',
 '/videos/packages/yala-dawn-leopard-quest.mp4',
 '5 hours', CURRENT_TIMESTAMP(6)),

(2,
 'Elephant & Birdlife Explorer',
 'A relaxed wildlife drive designed for elephant sightings, wetlands and Yala birdlife.',
 'Block I Wetland Loop', '06:00 - 10:00', 9800.00, 9800.00, 30, 5, 1,
 '/images/packages/elephant-birdlife-explorer.png',
 '/videos/packages/elephant-birdlife-explorer.mp4',
 '4 hours', CURRENT_TIMESTAMP(6)),

(3,
 'Golden Hour Sunset Safari',
 'Afternoon safari with golden-hour landscapes, waterholes and evening wildlife activity.',
 'Block I - Katagamuwa Route', '14:00 - 18:30', 11000.00, 11000.00, 30, 5, 1,
 '/images/packages/golden-hour-sunset-safari.png',
 '/videos/packages/golden-hour-sunset-safari.mp4',
 '4.5 hours', CURRENT_TIMESTAMP(6)),

(4,
 'Wildlife Photography Drive',
 'Smaller-group experience with slower pacing and photography-friendly stops where park rules allow.',
 'Block I Photography Circuit', '05:30 - 11:00', 15800.00, 15800.00, 16, 3, 1,
 '/images/packages/wildlife-photography-drive.png',
 '/videos/packages/wildlife-photography-drive.mp4',
 '5.5 hours', CURRENT_TIMESTAMP(6)),

(5,
 'Family Discovery Safari',
 'Family-friendly half-day safari with guide briefing, flexible pacing and wildlife interpretation.',
 'Block I Family Route', '07:00 - 11:00', 8500.00, 8500.00, 28, 5, 1,
 '/images/packages/family-discovery-safari.png',
 '/videos/packages/family-discovery-safari.mp4',
 '4 hours', CURRENT_TIMESTAMP(6)),

(6,
 'Full-Day Yala Explorer',
 'A full-day academic prototype package combining multiple habitats with a midday rest period.',
 'Block I Extended Route', '05:30 - 17:30', 22000.00, 22000.00, 20, 4, 1,
 '/images/packages/full-day-yala-explorer.png',
 '/videos/packages/full-day-yala-explorer.mp4',
 '12 hours', CURRENT_TIMESTAMP(6));

-- ============================================================================
-- VEHICLES + MAINTENANCE DEMO DATA
-- ============================================================================
INSERT INTO vehicles
(id, registration_no, model, capacity, status, document_valid_until, driver_id, created_at)
VALUES
(1, 'WP-SF-1001', 'Toyota Hilux Safari Jeep', 6, 'ASSIGNED',
 DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 4, CURRENT_TIMESTAMP(6)),
(2, 'WP-SF-1002', 'Mahindra Double Cab Safari', 6, 'AVAILABLE',
 DATE_ADD(CURDATE(), INTERVAL 10 MONTH), NULL, CURRENT_TIMESTAMP(6));

INSERT INTO maintenance_records
(id, vehicle_id, service_date, description, status, created_at)
VALUES
(1, 1, DATE_SUB(CURDATE(), INTERVAL 30 DAY),
 'Routine inspection, oil service, tyre and brake check.', 'COMPLETED', CURRENT_TIMESTAMP(6)),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 20 DAY),
 'Routine safety inspection and document verification.', 'COMPLETED', CURRENT_TIMESTAMP(6));

-- ============================================================================
-- DEMO BOOKINGS / VISITOR GROUPS
-- ============================================================================
INSERT INTO bookings
(id, booking_code, tourist_id, safari_package_id, visit_date, visitor_count,
 adult_count, child_five_to_eleven_count, child_below_five_count,
 group_leader_name, contact_phone, emergency_contact, special_requirements,
 booking_status, payment_status, total_amount, vehicle_count, vehicle_surcharge, created_at)
VALUES
(1, 'SL-DEMO01', 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 2,
 2, 0, 0,
 'Demo Tourist', '0771000001', '0779999999', 'Photography interest',
 'CONFIRMED', 'PAID', 25000.00, 1, 0.00, CURRENT_TIMESTAMP(6)),

(2, 'SL-DEMO02', 1, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 3,
 3, 0, 0,
 'Demo Tourist', '0771000001', '0778888888', 'Family group - child friendly pacing',
 'CONFIRMED', 'PAID', 29400.00, 1, 0.00, CURRENT_TIMESTAMP(6));

INSERT INTO visitors (id, booking_id, full_name, id_type, id_number, nationality, age)
VALUES
(1, 1, 'Demo Tourist', 'NIC', '200012345678', 'Sri Lankan', 22),
(2, 1, 'Demo Visitor 2', 'NIC', '200112345678', 'Sri Lankan', 21),
(3, 2, 'Demo Tourist', 'NIC', '200012345678', 'Sri Lankan', 22),
(4, 2, 'Family Visitor 1', 'NIC', '199012345678', 'Sri Lankan', 35),
(5, 2, 'Family Visitor 2', 'NIC', '201412345678', 'Sri Lankan', 12);

-- ============================================================================
-- DEMO PAYMENTS / INVOICES
-- These are SIMULATED payment records only.
-- No real card number, CVV or banking credential is stored.
-- ============================================================================
INSERT INTO payments
(id, payment_code, booking_id, amount, method, status,
 transaction_reference, invoice_number, card_brand, card_last4, paid_at, created_at)
VALUES
(1, 'PAY-DEMO01', 1, 25000.00, 'CARD', 'PAID',
 'CARD-DEMO-001', 'INV-YALA-DEMO01', 'VISA', '1111', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
(2, 'PAY-DEMO02', 2, 29400.00, 'MOBILE_WALLET', 'PAID',
 'SIM-DEMO-002', 'INV-YALA-DEMO02', NULL, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- ============================================================================
-- DEMO DIGITAL PERMITS
-- ============================================================================
INSERT INTO permits
(id, permit_code, booking_id, status, gate_name, decision_reason,
 decision_by_email, decision_by_name, decision_by_role, checked_in_by_email, checked_out_by_email,
 issued_at, checked_in_at, checked_out_at, created_at)
VALUES
(1, 'YALA-DEMO01', 1, 'APPROVED', 'Yala Palatupana Gate',
 'Demo booking approved for academic prototype.', 'park@safarilanka.lk', 'Authorized Park Gate Officer', 'PARK_OFFICER', NULL, NULL, CURRENT_TIMESTAMP(6), NULL, NULL, CURRENT_TIMESTAMP(6)),
(2, 'YALA-DEMO02', 2, 'PENDING', 'Yala Palatupana Gate',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP(6));

-- ============================================================================
-- DEMO JEEP / DRIVER / GUIDE ASSIGNMENT
-- ============================================================================
INSERT INTO trip_assignments
(id, booking_id, vehicle_id, driver_id, guide_id, status, assigned_at)
VALUES
(1, 1, 1, 4, 3, 'ASSIGNED', CURRENT_TIMESTAMP(6));

-- Demo Guide Roster CRUD data
INSERT INTO guide_rosters
(id, guide_id, roster_date, shift, available, notes, created_at, updated_at)
VALUES
(1, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'MORNING', 1, 'Available for the demo Block I safari.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
(2, 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'FULL_DAY', 1, 'Open roster slot for CRUD demonstration.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- Demo Park Compliance data (database table name retained for backward compatibility; kept as DRAFT for edit/delete/finalize)
INSERT INTO gate_compliance_records
(id, permit_id, officer_id, gate_name, vehicle_registration, inspection_date,
 permit_verified, visitor_count_verified, vehicle_verified, guide_verified, driver_verified,
 compliance_status, record_status, notes, created_at, updated_at)
VALUES
(1, 1, 5, 'Yala Palatupana Gate', 'WP-SF-1001', CURRENT_TIMESTAMP(6),
 1, 1, 1, 1, 1, 'PASSED', 'DRAFT', 'Demo draft inspection record for CRUD evaluation.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================
INSERT INTO system_settings (id, setting_key, setting_value, description)
VALUES
(1, 'park.name', 'Yala National Park', 'Prototype park scope'),
(2, 'park.gate', 'Yala Palatupana Gate', 'Default permit validation gate'),
(3, 'payment.mode', 'SIMULATED', 'Academic payment mode - no real gateway'),
(4, 'notifications.enabled', 'true', 'In-app notification feature flag'),
(5, 'academic.disclaimer',
 'This is an academic prototype and not an official DWC system.',
 'Required prototype disclaimer'),
(6, 'chatbot.enabled', 'true', 'Tourist Kavi chatbot feature flag controlled by System Administration');

-- ============================================================================
-- INITIAL AUDIT LOGS
-- ============================================================================
INSERT INTO audit_logs (actor_email, action, details, created_at)
VALUES
('admin@safarilanka.lk', 'DATABASE_INITIALIZED',
 'Safari Lanka clean-install database script completed.', CURRENT_TIMESTAMP(6)),
('operator@safarilanka.lk', 'DEMO_ASSIGNMENT_CREATED',
 'SL-DEMO01 assigned to WP-SF-1001, Yala Jeep Driver and Senior Safari Guide.', CURRENT_TIMESTAMP(6)),
('finance@safarilanka.lk', 'DEMO_PAYMENTS_SEEDED',
 'Simulated demo payment and invoice records created.', CURRENT_TIMESTAMP(6));

-- ============================================================================
-- REPORTING / DASHBOARD VIEWS
-- These views are optional helpers and do not interfere with JPA entities.
-- ============================================================================
CREATE OR REPLACE VIEW v_booking_overview AS
SELECT
    b.id,
    b.booking_code,
    u.full_name AS tourist_name,
    u.email AS tourist_email,
    sp.name AS package_name,
    sp.route_zone,
    sp.time_slot,
    b.visit_date,
    b.visitor_count,
    b.adult_count,
    b.child_five_to_eleven_count,
    b.child_below_five_count,
    (b.adult_count + b.child_five_to_eleven_count) AS chargeable_visitor_count,
    b.booking_status,
    b.payment_status,
    b.total_amount,
    b.created_at
FROM bookings b
JOIN users u ON u.id = b.tourist_id
JOIN safari_packages sp ON sp.id = b.safari_package_id;

CREATE OR REPLACE VIEW v_finance_overview AS
SELECT
    p.id AS payment_id,
    p.payment_code,
    b.booking_code,
    u.full_name AS tourist_name,
    p.amount,
    p.method,
    p.status AS payment_status,
    p.transaction_reference,
    p.invoice_number,
    p.paid_at,
    COALESCE((
        SELECT SUM(r.amount)
        FROM refund_requests r
        WHERE r.payment_id = p.id
          AND r.status IN ('APPROVED','PROCESSED')
    ), 0.00) AS approved_or_processed_refund_amount
FROM payments p
JOIN bookings b ON b.id = p.booking_id
JOIN users u ON u.id = b.tourist_id;

CREATE OR REPLACE VIEW v_permit_overview AS
SELECT
    pe.id AS permit_id,
    pe.permit_code,
    pe.status AS permit_status,
    pe.gate_name,
    b.booking_code,
    b.visit_date,
    b.visitor_count,
    u.full_name AS group_leader,
    sp.name AS package_name,
    pe.issued_at,
    pe.checked_in_at,
    pe.checked_out_at
FROM permits pe
JOIN bookings b ON b.id = pe.booking_id
JOIN users u ON u.id = b.tourist_id
JOIN safari_packages sp ON sp.id = b.safari_package_id;

CREATE OR REPLACE VIEW v_trip_assignment_overview AS
SELECT
    ta.id AS assignment_id,
    b.booking_code,
    b.visit_date,
    sp.name AS package_name,
    v.registration_no,
    v.model AS vehicle_model,
    d.full_name AS driver_name,
    g.full_name AS guide_name,
    ta.status AS assignment_status,
    ta.assigned_at
FROM trip_assignments ta
JOIN bookings b ON b.id = ta.booking_id
JOIN safari_packages sp ON sp.id = b.safari_package_id
JOIN vehicles v ON v.id = ta.vehicle_id
JOIN users d ON d.id = ta.driver_id
JOIN users g ON g.id = ta.guide_id;

CREATE OR REPLACE VIEW v_package_daily_capacity AS
SELECT
    sp.id AS package_id,
    sp.name AS package_name,
    b.visit_date,
    sp.max_visitors,
    COALESCE(SUM(
        CASE
            WHEN b.booking_status IN ('PENDING','CONFIRMED')
            THEN b.visitor_count
            ELSE 0
        END
    ), 0) AS reserved_visitors,
    GREATEST(
        sp.max_visitors - COALESCE(SUM(
            CASE
                WHEN b.booking_status IN ('PENDING','CONFIRMED')
                THEN b.visitor_count
                ELSE 0
            END
        ), 0),
        0
    ) AS remaining_capacity
FROM safari_packages sp
LEFT JOIN bookings b ON b.safari_package_id = sp.id
GROUP BY sp.id, sp.name, b.visit_date, sp.max_visitors;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run the entire script, then inspect these result sets in MySQL Workbench.
-- ============================================================================
SELECT DATABASE() AS active_database;

SELECT
    (SELECT COUNT(*) FROM users) AS users_count,
    (SELECT COUNT(*) FROM safari_packages) AS packages_count,
    (SELECT COUNT(*) FROM bookings) AS bookings_count,
    (SELECT COUNT(*) FROM vehicles) AS vehicles_count,
    (SELECT COUNT(*) FROM payments) AS payments_count,
    (SELECT COUNT(*) FROM permits) AS permits_count,
    (SELECT COUNT(*) FROM trip_assignments) AS assignments_count,
    (SELECT COUNT(*) FROM contact_messages) AS contact_requests_count;

SELECT id, full_name, email, role, active
FROM users
ORDER BY id;

SELECT * FROM v_booking_overview ORDER BY id;

SELECT 'Safari Lanka database created successfully.' AS status;
