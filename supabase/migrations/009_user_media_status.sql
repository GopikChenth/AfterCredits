-- User Media Status table
-- Handles both watch status and wishlist in a single table

CREATE TABLE IF NOT EXISTS user_media_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL,
  media_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('watching', 'watched', 'dropped')),
  is_wishlisted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One entry per user per media
  UNIQUE(user_id, media_type, media_id)
);

-- Auto-remove wishlist when status = 'watched'
CREATE OR REPLACE FUNCTION auto_remove_wishlist()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'watched' THEN
    NEW.is_wishlisted = false;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_remove_wishlist
  BEFORE INSERT OR UPDATE ON user_media_status
  FOR EACH ROW EXECUTE FUNCTION auto_remove_wishlist();

-- RLS
ALTER TABLE user_media_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own status"
  ON user_media_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own status"
  ON user_media_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own status"
  ON user_media_status FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own status"
  ON user_media_status FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_media_status_lookup ON user_media_status(user_id, media_type, media_id);
CREATE INDEX idx_user_media_status_wishlist ON user_media_status(user_id, is_wishlisted) WHERE is_wishlisted = true;
CREATE INDEX idx_user_media_status_status ON user_media_status(user_id, status) WHERE status IS NOT NULL;
