-- =====================================================
-- CLEANUP: Drop Extension Tables
-- Keep only the main reviews table
-- =====================================================

-- Drop all review details tables
DROP TABLE IF EXISTS review_details_anime CASCADE;
DROP TABLE IF EXISTS review_details_game CASCADE;
DROP TABLE IF EXISTS review_details_movie CASCADE;
DROP TABLE IF EXISTS review_details_comic CASCADE;
DROP TABLE IF EXISTS review_details_manga CASCADE;

-- Verify remaining tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'review%';
-- Should only show 'reviews' table
