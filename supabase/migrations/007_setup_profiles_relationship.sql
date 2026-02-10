-- Create explicit relationship between reviews and profiles
-- Both tables reference auth.users(id), so we need to tell Supabase how to join them

-- First, ensure the profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  real_name TEXT,
  display_name TEXT,
  use_display_name BOOLEAN DEFAULT false,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Now, we need to tell Supabase how reviews.user_id relates to profiles.id
-- This is done by creating a foreign key relationship name

-- The relationship is implicit because:
-- reviews.user_id -> auth.users(id)
-- profiles.id -> auth.users(id)
-- So we join on reviews.user_id = profiles.id

-- To make this work in PostgREST (Supabase's API layer), we don't need an FK
-- We just need to use the correct column name in our query
-- The query should be: profiles!user_id (meaning join on reviews.user_id = profiles.id)
