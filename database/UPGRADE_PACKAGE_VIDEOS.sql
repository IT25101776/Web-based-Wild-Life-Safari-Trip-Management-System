USE safari_lanka;

-- Add package hover video support to an existing database.
ALTER TABLE safari_packages ADD COLUMN IF NOT EXISTS video_url VARCHAR(1000) NULL AFTER image_url;

UPDATE safari_packages SET video_url='/videos/packages/yala-dawn-leopard-quest.mp4' WHERE name='Yala Dawn Leopard Quest' AND (video_url IS NULL OR video_url='');
UPDATE safari_packages SET video_url='/videos/packages/elephant-birdlife-explorer.mp4' WHERE name='Elephant & Birdlife Explorer' AND (video_url IS NULL OR video_url='');
UPDATE safari_packages SET video_url='/videos/packages/golden-hour-sunset-safari.mp4' WHERE name='Golden Hour Sunset Safari' AND (video_url IS NULL OR video_url='');
UPDATE safari_packages SET video_url='/videos/packages/wildlife-photography-drive.mp4' WHERE name='Wildlife Photography Drive' AND (video_url IS NULL OR video_url='');
UPDATE safari_packages SET video_url='/videos/packages/family-discovery-safari.mp4' WHERE name='Family Discovery Safari' AND (video_url IS NULL OR video_url='');
UPDATE safari_packages SET video_url='/videos/packages/full-day-yala-explorer.mp4' WHERE name='Full-Day Yala Explorer' AND (video_url IS NULL OR video_url='');
