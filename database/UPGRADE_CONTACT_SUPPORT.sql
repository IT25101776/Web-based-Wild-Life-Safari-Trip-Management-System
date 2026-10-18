USE safari_lanka;

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(30) NULL,
    booking_code VARCHAR(40) NULL,
    subject VARCHAR(160) NOT NULL,
    message VARCHAR(3000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE INDEX idx_contact_status ON contact_messages(status);
CREATE INDEX idx_contact_created ON contact_messages(created_at);
CREATE INDEX idx_contact_booking ON contact_messages(booking_code);
