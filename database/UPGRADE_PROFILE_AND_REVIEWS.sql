USE safari_lanka;

-- Add profile picture path only when the column does not already exist.
SET @profile_column_sql = (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='users' AND column_name='profile_image_url'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(1000) NULL AFTER license_number'
  )
);
PREPARE profile_stmt FROM @profile_column_sql;
EXECUTE profile_stmt;
DEALLOCATE PREPARE profile_stmt;

-- Verified post-trip tourist reviews.
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    tourist_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    overall_rating INT NOT NULL,
    driver_rating INT NULL,
    guide_rating INT NULL,
    title VARCHAR(180) NULL,
    review_text VARCHAR(4000) NOT NULL,
    driver_review VARCHAR(2000) NULL,
    guide_review VARCHAR(2000) NULL,
    media_urls LONGTEXT NULL,
    published TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_review_booking (booking_id),
    KEY idx_reviews_published (published, created_at),
    KEY idx_reviews_tourist (tourist_id),
    KEY idx_reviews_package (package_id),
    CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_review_tourist FOREIGN KEY (tourist_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_review_package FOREIGN KEY (package_id) REFERENCES safari_packages(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_review_overall CHECK (overall_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_review_driver CHECK (driver_rating IS NULL OR driver_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_review_guide CHECK (guide_rating IS NULL OR guide_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;
