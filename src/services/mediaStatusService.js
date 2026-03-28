import { supabase } from './supabase';

/**
 * Media Status Service
 * Handles watch status and wishlist for all media types
 */

// ==========================================
// GET STATUS
// ==========================================

/**
 * Get user's status for a specific media
 * @param {string} mediaType - 'anime', 'movie', 'game', etc.
 * @param {string} mediaId - The media ID
 * @returns {{ success: boolean, data: { status, is_wishlisted } }}
 */
export const getMediaStatus = async (mediaType, mediaId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not logged in', notLoggedIn: true };

    const { data, error } = await supabase
      .from('user_media_status')
      .select('status, is_wishlisted')
      .eq('user_id', user.id)
      .eq('media_type', mediaType)
      .eq('media_id', mediaId)
      .maybeSingle();

    if (error) throw error;

    return {
      success: true,
      data: data || { status: null, is_wishlisted: false },
    };
  } catch (error) {
    console.error('Error getting media status:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// SET STATUS
// ==========================================

/**
 * Set watch status for a media
 * @param {string} mediaType
 * @param {string} mediaId
 * @param {string|null} status - 'watching', 'watched', 'dropped', or null to clear
 */
export const setMediaStatus = async (mediaType, mediaId, status) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not logged in' };

    if (status === null) {
      // If clearing status, update existing row or do nothing
      const { data: existing } = await supabase
        .from('user_media_status')
        .select('id, is_wishlisted')
        .eq('user_id', user.id)
        .eq('media_type', mediaType)
        .eq('media_id', mediaId)
        .maybeSingle();

      if (existing) {
        if (!existing.is_wishlisted) {
          // No status and no wishlist, delete the row
          await supabase
            .from('user_media_status')
            .delete()
            .eq('id', existing.id);
        } else {
          // Still wishlisted, just clear status
          await supabase
            .from('user_media_status')
            .update({ status: null })
            .eq('id', existing.id);
        }
      }

      return { success: true };
    }

    // Upsert status
    const { data, error } = await supabase
      .from('user_media_status')
      .upsert(
        {
          user_id: user.id,
          media_type: mediaType,
          media_id: mediaId,
          status: status,
        },
        { onConflict: 'user_id,media_type,media_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error setting media status:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// WISHLIST
// ==========================================

/**
 * Toggle wishlist for a media
 * @param {string} mediaType
 * @param {string} mediaId
 * @param {boolean} wishlisted
 */
export const setWishlist = async (mediaType, mediaId, wishlisted) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not logged in' };

    if (!wishlisted) {
      // Removing from wishlist - check if we should delete the row
      const { data: existing } = await supabase
        .from('user_media_status')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('media_type', mediaType)
        .eq('media_id', mediaId)
        .maybeSingle();

      if (existing) {
        if (!existing.status) {
          // No status either, delete the row entirely
          await supabase
            .from('user_media_status')
            .delete()
            .eq('id', existing.id);
        } else {
          // Has a status, just clear wishlist
          await supabase
            .from('user_media_status')
            .update({ is_wishlisted: false })
            .eq('id', existing.id);
        }
      }

      return { success: true };
    }

    // Adding to wishlist via upsert
    const { data, error } = await supabase
      .from('user_media_status')
      .upsert(
        {
          user_id: user.id,
          media_type: mediaType,
          media_id: mediaId,
          is_wishlisted: true,
        },
        { onConflict: 'user_id,media_type,media_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// LIST QUERIES
// ==========================================

/**
 * Get user's watchlist (all media with a specific status)
 * @param {string} status - 'watching', 'watched', 'dropped'
 * @param {string} [mediaType] - Optional filter by media type
 */
export const getByStatus = async (status, mediaType = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not logged in' };

    let query = supabase
      .from('user_media_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('updated_at', { ascending: false });

    if (mediaType) query = query.eq('media_type', mediaType);

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error getting by status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's wishlist
 * @param {string} [mediaType] - Optional filter by media type
 */
export const getWishlist = async (mediaType = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not logged in' };

    let query = supabase
      .from('user_media_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_wishlisted', true)
      .order('updated_at', { ascending: false });

    if (mediaType) query = query.eq('media_type', mediaType);

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// GAME USER OVERVIEW STATS
// ==========================================

/**
 * Fetch 4 overview stats for the current user's games library.
 * Returns: { gamesPlayed, avgRating, wishlistCount }
 * (completionistHours comes from IGDB — pass it separately from igdbData)
 */
export const getGameUserStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const uid = user.id;

    const [playedRes, wishlistRes, ratingsRes] = await Promise.all([
      // Total games with any status
      supabase
        .from('user_media_status')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('media_type', 'games')
        .not('status', 'is', null),

      // Wishlisted
      supabase
        .from('user_media_status')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('media_type', 'games')
        .eq('is_wishlisted', true),

      // User's own game ratings (for avg)
      supabase
        .from('reviews')
        .select('overall_rating')
        .eq('user_id', uid)
        .eq('media_type', 'games'),
    ]);

    const gamesPlayed   = playedRes.count   ?? 0;
    const wishlistCount = wishlistRes.count  ?? 0;
    const ratings       = ratingsRes.data   || [];
    const avgRating     = ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.overall_rating, 0) / ratings.length) * 10) / 10
      : null;

    return { gamesPlayed, avgRating, wishlistCount };
  } catch (e) {
    console.warn('getGameUserStats error:', e.message);
    return null;
  }
};
