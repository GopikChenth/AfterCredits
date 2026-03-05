-- Review likes table + race-safe aggregate maintenance

CREATE TABLE IF NOT EXISTS review_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);

ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all review likes"
  ON review_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own review likes"
  ON review_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own review likes"
  ON review_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION sync_review_likes_count(p_review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reviews
  SET likes_count = (
    SELECT COUNT(*)::INTEGER
    FROM review_likes
    WHERE review_id = p_review_id
  )
  WHERE id = p_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trg_sync_review_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  target_review_id UUID;
BEGIN
  target_review_id := COALESCE(NEW.review_id, OLD.review_id);
  PERFORM sync_review_likes_count(target_review_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_likes_sync_count_after_insert ON review_likes;
DROP TRIGGER IF EXISTS review_likes_sync_count_after_delete ON review_likes;

CREATE TRIGGER review_likes_sync_count_after_insert
  AFTER INSERT ON review_likes
  FOR EACH ROW EXECUTE FUNCTION trg_sync_review_likes_count();

CREATE TRIGGER review_likes_sync_count_after_delete
  AFTER DELETE ON review_likes
  FOR EACH ROW EXECUTE FUNCTION trg_sync_review_likes_count();

-- Backfill in case review_likes already has rows.
UPDATE reviews r
SET likes_count = COALESCE(rl.cnt, 0)
FROM (
  SELECT review_id, COUNT(*)::INTEGER AS cnt
  FROM review_likes
  GROUP BY review_id
) rl
WHERE rl.review_id = r.id;

