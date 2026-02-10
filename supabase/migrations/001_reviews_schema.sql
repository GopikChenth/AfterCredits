-- =====================================================
-- STRATEGY 3: HYBRID BASE + EXTENSION TABLES
-- Reviews Database Schema Implementation
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MAIN REVIEWS TABLE (Base for all media types)
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('anime', 'game', 'movie', 'comic', 'manga')),
  media_id TEXT NOT NULL,
  
  -- Common review fields
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 10),
  content TEXT,
  is_spoiler BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reviews
  UNIQUE(user_id, media_type, media_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_feed ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_media ON reviews(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_media ON reviews(user_id, media_type);

-- =====================================================
-- 2. EXTENSION TABLE: ANIME REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS review_details_anime (
  review_id UUID PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  
  -- Anime-specific ratings
  story_rating INTEGER CHECK (story_rating BETWEEN 1 AND 10),
  animation_rating INTEGER CHECK (animation_rating BETWEEN 1 AND 10),
  sound_rating INTEGER CHECK (sound_rating BETWEEN 1 AND 10),
  character_rating INTEGER CHECK (character_rating BETWEEN 1 AND 10),
  
  -- Additional anime metadata
  episodes_watched INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. EXTENSION TABLE: GAME REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS review_details_game (
  review_id UUID PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  
  -- Game-specific ratings
  gameplay_rating INTEGER CHECK (gameplay_rating BETWEEN 1 AND 10),
  graphics_rating INTEGER CHECK (graphics_rating BETWEEN 1 AND 10),
  story_rating INTEGER CHECK (story_rating BETWEEN 1 AND 10),
  performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 10),
  
  -- Additional game metadata
  platform_played TEXT,
  hours_played INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. EXTENSION TABLE: MOVIE REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS review_details_movie (
  review_id UUID PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  
  -- Movie-specific ratings
  acting_rating INTEGER CHECK (acting_rating BETWEEN 1 AND 10),
  cinematography_rating INTEGER CHECK (cinematography_rating BETWEEN 1 AND 10),
  script_rating INTEGER CHECK (script_rating BETWEEN 1 AND 10),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. EXTENSION TABLE: COMIC REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS review_details_comic (
  review_id UUID PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  
  -- Comic-specific ratings
  story_rating INTEGER CHECK (story_rating BETWEEN 1 AND 10),
  art_rating INTEGER CHECK (art_rating BETWEEN 1 AND 10),
  character_rating INTEGER CHECK (character_rating BETWEEN 1 AND 10),
  
  -- Additional comic metadata
  issues_read INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. EXTENSION TABLE: MANGA REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS review_details_manga (
  review_id UUID PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  
  -- Manga-specific ratings
  story_rating INTEGER CHECK (story_rating BETWEEN 1 AND 10),
  art_rating INTEGER CHECK (art_rating BETWEEN 1 AND 10),
  character_rating INTEGER CHECK (character_rating BETWEEN 1 AND 10),
  
  -- Additional manga metadata
  chapters_read INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_details_anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_details_game ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_details_movie ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_details_comic ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_details_manga ENABLE ROW LEVEL SECURITY;

-- Reviews table policies
CREATE POLICY "Users can view all reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Extension tables policies (anime)
CREATE POLICY "Users can view all anime review details"
  ON review_details_anime FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own anime review details"
  ON review_details_anime FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own anime review details"
  ON review_details_anime FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own anime review details"
  ON review_details_anime FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

-- Extension tables policies (game)
CREATE POLICY "Users can view all game review details"
  ON review_details_game FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own game review details"
  ON review_details_game FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own game review details"
  ON review_details_game FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own game review details"
  ON review_details_game FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

-- Extension tables policies (movie)
CREATE POLICY "Users can view all movie review details"
  ON review_details_movie FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own movie review details"
  ON review_details_movie FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own movie review details"
  ON review_details_movie FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own movie review details"
  ON review_details_movie FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

-- Extension tables policies (comic)
CREATE POLICY "Users can view all comic review details"
  ON review_details_comic FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own comic review details"
  ON review_details_comic FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own comic review details"
  ON review_details_comic FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own comic review details"
  ON review_details_comic FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

-- Extension tables policies (manga)
CREATE POLICY "Users can view all manga review details"
  ON review_details_manga FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own manga review details"
  ON review_details_manga FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own manga review details"
  ON review_details_manga FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own manga review details"
  ON review_details_manga FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

-- =====================================================
-- 8. FUNCTIONS FOR AUTO-UPDATE TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
