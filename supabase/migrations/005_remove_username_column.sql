-- Remove user_name column from reviews table
-- We'll join with profiles table instead

ALTER TABLE reviews DROP COLUMN IF EXISTS user_name;
