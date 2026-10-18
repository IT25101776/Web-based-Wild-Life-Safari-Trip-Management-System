-- Safari Lanka - preferred language profile upgrade
-- Use this only for an existing database. Fresh installs should use SAFARI_LANKA_FULL.sql.

USE safari_lanka;

ALTER TABLE users
  ADD COLUMN preferred_language VARCHAR(20) NOT NULL DEFAULT 'ENGLISH' AFTER preferred_currency;

UPDATE users
SET preferred_language = 'ENGLISH'
WHERE preferred_language IS NULL OR preferred_language = '';
