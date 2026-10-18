USE safari_lanka;

CREATE TABLE IF NOT EXISTS account_change_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    requester_id BIGINT NOT NULL,
    current_full_name VARCHAR(255) NOT NULL,
    current_email VARCHAR(255) NOT NULL,
    requested_full_name VARCHAR(255) NOT NULL,
    requested_email VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    admin_note VARCHAR(1000) NULL,
    reviewed_by_email VARCHAR(255) NULL,
    reviewed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_account_change_requester FOREIGN KEY (requester_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO system_settings(setting_key,setting_value,description)
SELECT 'chatbot.enabled','true','Tourist Kavi chatbot feature flag controlled by System Administration'
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key='chatbot.enabled');

SELECT 'Account deletion / email-change / chatbot settings upgrade applied' AS status;
