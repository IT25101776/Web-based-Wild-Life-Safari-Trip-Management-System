-- WARNING: removes all project data.
DROP DATABASE IF EXISTS safari_lanka;
CREATE DATABASE safari_lanka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SELECT 'safari_lanka reset complete - restart Spring Boot to recreate and reseed tables' AS status;
