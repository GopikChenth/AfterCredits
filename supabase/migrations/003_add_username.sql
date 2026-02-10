-- Add username column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Update existing reviews to have a default username
UPDATE reviews SET user_name = 'Anonymous User' WHERE user_name IS NULL;
