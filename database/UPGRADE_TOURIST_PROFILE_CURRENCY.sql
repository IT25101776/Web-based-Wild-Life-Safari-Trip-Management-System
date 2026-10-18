USE safari_lanka;

-- Tourist registration/profile extension
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS country VARCHAR(120) NULL AFTER address,
    ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) NULL DEFAULT 'LKR' AFTER country,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(30) NULL AFTER preferred_currency,
    ADD COLUMN IF NOT EXISTS birth_date DATE NULL AFTER gender,
    ADD COLUMN IF NOT EXISTS identity_type VARCHAR(20) NULL AFTER birth_date,
    ADD COLUMN IF NOT EXISTS identity_number VARCHAR(40) NULL AFTER identity_type;

UPDATE users
SET preferred_currency = 'LKR'
WHERE preferred_currency IS NULL OR preferred_currency = '';

-- Populate only the built-in demo tourist. Existing real tourist accounts are left
-- for the user to complete in My Account because their country/identity cannot be inferred safely.
UPDATE users
SET country='Sri Lanka', preferred_currency='LKR', gender='MALE', birth_date='2004-01-01',
    identity_type='NIC', identity_number='200012345678'
WHERE email='tourist@safarilanka.lk';
