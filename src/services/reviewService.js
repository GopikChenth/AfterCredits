import { supabase } from './supabase';

/**
 * Reviews Service - Simplified Version
 * Single reviews table only (no extension tables)
 */

// ==========================================
// CREATE REVIEW
// ==========================================

/**
 * Submit a new review
 * @param {Object} reviewData - Review data
 * @returns {Object} Created review
 */
export const submitReview = async (reviewData) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('User not authenticated');


    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.user.id,
        media_type: reviewData.mediaType,
        media_id: reviewData.mediaId,
        overall_rating: reviewData.overallRating,
        content: reviewData.content,
        is_spoiler: reviewData.isSpoiler || false,
      })
      .select()
      .single();

    if (reviewError) throw reviewError;

    return { success: true, review };
  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// GET REVIEWS
// ==========================================

/**
 * Get reviews for a specific media
 * @param {string} mediaType - Type of media
 * @param {string} mediaId - Media ID
 * @returns {Array} Reviews
 */
export const getMediaReviews = async (mediaType, mediaId) => {
  try {
    // Step 1: Fetch reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('media_type', mediaType)
      .eq('media_id', mediaId)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;
    if (!reviews || reviews.length === 0) return { success: true, reviews: [] };

    // Step 2: Fetch profiles for all review authors separately
    const userIds = [...new Set(reviews.map(r => r.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, use_display_name, avatar_url')
      .in('id', userIds);

    // Build a lookup map (profiles may be null if RLS blocks access)
    const profileMap = {};
    if (!profilesError && profiles) {
      profiles.forEach(p => { profileMap[p.id] = p; });
    }

    // Step 3: Merge profile data into reviews
    const enrichedReviews = reviews.map(review => ({
      ...review,
      profiles: profileMap[review.user_id] || null,
    }));

    return { success: true, reviews: enrichedReviews };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's review for specific media
 * @param {string} mediaType - Type of media
 * @param {string} mediaId - Media ID
 * @returns {Object} User's review
 */
export const getUserReview = async (mediaType, mediaId) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('media_type', mediaType)
      .eq('media_id', mediaId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    return { success: true, review: data };
  } catch (error) {
    console.error('Error fetching user review:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all reviews by a user (unified feed)
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Array} All user's reviews across all media types
 */
export const getUserReviews = async (userId = null) => {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('User not found');

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, reviews: data };
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// UPDATE REVIEW
// ==========================================

/**
 * Update an existing review
 * @param {string} reviewId - Review ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated review
 */
export const updateReview = async (reviewId, updates) => {
  try {
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();

    if (reviewError) throw reviewError;

    return { success: true, review };
  } catch (error) {
    console.error('Error updating review:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// DELETE REVIEW
// ==========================================

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @returns {boolean} Success status
 */
export const deleteReview = async (reviewId) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// LIKE REVIEW
// ==========================================

/**
 * Toggle like on a review
 * @param {string} reviewId - Review ID
 * @param {boolean|null} desiredLiked - Optional explicit target state
 * @returns {Object} Updated like state + count
 */
export const toggleReviewLike = async (reviewId, desiredLiked = null) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData?.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Current like state for this user/review pair
    const { data: existingLike, error: existingLikeError } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLikeError) throw existingLikeError;

    const currentlyLiked = !!existingLike;
    const nextLiked =
      typeof desiredLiked === 'boolean' ? desiredLiked : !currentlyLiked;

    if (nextLiked !== currentlyLiked) {
      if (nextLiked) {
        const { error: insertError } = await supabase
          .from('review_likes')
          .insert({ review_id: reviewId, user_id: userId });

        // 23505 = unique_violation (already liked in a race)
        if (insertError && insertError.code !== '23505') throw insertError;
      } else {
        const { error: deleteError } = await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      }
    }

    // Always return canonical count from source of truth.
    const { count, error: countError } = await supabase
      .from('review_likes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId);

    if (countError) throw countError;

    // Normalize final liked state after race windows.
    const { data: likeState, error: likeStateError } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (likeStateError) throw likeStateError;

    return {
      success: true,
      liked: !!likeState,
      likes: count || 0,
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// STATISTICS
// ==========================================

/**
 * Get review statistics for a media
 * @param {string} mediaType - Type of media
 * @param {string} mediaId - Media ID
 * @returns {Object} Stats (count, avg rating, etc.)
 */
export const getMediaReviewStats = async (mediaType, mediaId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('overall_rating')
      .eq('media_type', mediaType)
      .eq('media_id', mediaId);

    if (error) throw error;

    const count = data.length;
    const avgRating = count > 0 
      ? data.reduce((sum, r) => sum + r.overall_rating, 0) / count 
      : 0;

    return {
      success: true,
      stats: {
        count,
        averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
      },
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { success: false, error: error.message };
  }
};
