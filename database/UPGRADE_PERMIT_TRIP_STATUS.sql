-- Safari Lanka permit/trip-status upgrade
-- Run only if you prefer a manual DB migration. Hibernate ddl-auto=update can also create these columns.

ALTER TABLE permits ADD COLUMN decision_by_email VARCHAR(255) NULL;
ALTER TABLE permits ADD COLUMN decision_by_name VARCHAR(255) NULL;
ALTER TABLE permits ADD COLUMN decision_by_role VARCHAR(80) NULL;
ALTER TABLE permits ADD COLUMN checked_in_by_email VARCHAR(255) NULL;
ALTER TABLE permits ADD COLUMN checked_out_by_email VARCHAR(255) NULL;

UPDATE permits
SET decision_by_name = 'Authorized Park / Gate Officer',
    decision_by_role = 'PARK_OFFICER'
WHERE status <> 'PENDING' AND decision_by_name IS NULL;
