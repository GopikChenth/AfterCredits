-- Create foreign key relationship between reviews.user_id and profiles.id
-- This tells PostgreSQL (and Supabase) how to join these tables

-- Add foreign key constraint
-- This creates a relationship: reviews.user_id -> profiles.id
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

ALTER TABLE reviews 
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Verify the relationship was created
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'reviews';
