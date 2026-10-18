-- Safari Lanka - optional ngrok compatibility fix for an EXISTING database.
-- No schema change is required.
-- This only converts old absolute backend upload URLs such as
-- http://localhost:8080/uploads/package-images/... into relative URLs.
-- Relative URLs work on localhost, LAN and ngrok with the new Vite proxy.

USE safari_lanka;

UPDATE safari_packages
SET image_url = CONCAT(
    '/uploads/package-images/',
    SUBSTRING_INDEX(image_url, '/uploads/package-images/', -1)
)
WHERE image_url IS NOT NULL
  AND image_url LIKE '%/uploads/package-images/%';
