-- Add the use_display_name column to existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS use_display_name BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN profiles.use_display_name IS 'Privacy toggle: true = show display_name publicly, false = show username publicly';
