import { supabase } from './supabase';

/**
 * Media Status Service
 * Handles watch status and wishlist for all media types
 */

const clampPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const parseHours = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round(numeric * 100) / 100;
};

const isMissingDbObjectError = (error) => {
  if (!error) return false;
  const text = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
  return (
    (text.includes('column') && (text.includes('does not exist') || text.includes('could not find the'))) ||
    (text.includes('relation') && text.includes('does not exist')) ||
    (text.includes('table') && text.includes('does not exist'))
  );
};

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

    // Keep game detail table in sync when a game is completed.
    if (mediaType === 'games' && status === 'watched') {
      const trackingRes = await saveGameTracking(mediaId, { forceCompletedProgress: true });
      if (!trackingRes.success) {
        console.warn('Unable to persist game completion details:', trackingRes.error);
      }
    }

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

const ensureGameStatusRow = async (userId, mediaId, status = undefined) => {
  const basePayload = {
    user_id: userId,
    media_type: 'games',
    media_id: String(mediaId),
  };

  if (status !== undefined) {
    basePayload.status = status;
  }

  const { data, error } = await supabase
    .from('user_media_status')
    .upsert(basePayload, { onConflict: 'user_id,media_type,media_id' })
    .select('id')
    .single();

  if (error) throw error;
  return data;
};

// ==========================================
// GAME TRACKING
// ==========================================

/**
 * Convert playtime against IGDB time-to-beat targets into percentages.
 * @param {number|string|null} playtimeHours
 * @param {number|string|null} mainStoryHours
 * @param {number|string|null} completionistHours
 * @returns {{ storyProgress: number|null, overallProgress: number|null }}
 */
export const calculateGameProgressFromPlaytime = (
  playtimeHours,
  mainStoryHours,
  completionistHours
) => {
  const played = parseHours(playtimeHours);
  const storyTarget = parseHours(mainStoryHours);
  const overallTarget = parseHours(completionistHours);

  if (played === null) {
    return { storyProgress: null, overallProgress: null };
  }

  const toPercent = (target) => {
    if (target === null || target <= 0) return null;
    return clampPercent((played / target) * 100);
  };

  return {
    storyProgress: toPercent(storyTarget),
    overallProgress: toPercent(overallTarget),
  };
};

/**
 * Persist game-specific tracking data on user_game_status_details.
 * Shared status row stays in user_media_status.
 */
export const saveGameTracking = async (mediaId, payload = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not logged in' };

    const statusRow = await ensureGameStatusRow(user.id, mediaId, payload.status);
    const detailUpdates = {};

    if (payload.storyProgress !== undefined) {
      detailUpdates.story_progress = clampPercent(payload.storyProgress);
    }
    if (payload.overallProgress !== undefined) {
      detailUpdates.overall_progress = clampPercent(payload.overallProgress);
    }
    if (payload.platform !== undefined) {
      detailUpdates.played_platform = payload.platform || null;
    }
    if (payload.playtimeHours !== undefined) {
      detailUpdates.playtime_hours = parseHours(payload.playtimeHours);
    }
    if (payload.completedDlcs !== undefined) {
      detailUpdates.completed_dlcs = Array.isArray(payload.completedDlcs)
        ? payload.completedDlcs
        : [];
    }
    if (payload.storyCompletionTimeHours !== undefined) {
      detailUpdates.story_completion_time_hours = parseHours(payload.storyCompletionTimeHours);
    }
    if (payload.totalCompletionTimeHours !== undefined) {
      detailUpdates.total_completion_time_hours = parseHours(payload.totalCompletionTimeHours);
    }

    const forceCompletedProgress = payload.forceCompletedProgress || payload.status === 'watched';
    if (forceCompletedProgress) {
      detailUpdates.story_progress = 100;
      // overall_progress is set by the user in CompletedWindow, not auto-maxed
      detailUpdates.completed_at = new Date().toISOString();
    }

    const hasDetails = Object.keys(detailUpdates).length > 0;
    if (!hasDetails) return { success: true, data: statusRow };

    const { data, error } = await supabase
      .from('user_game_status_details')
      .upsert(
        {
          user_media_status_id: statusRow.id,
          ...detailUpdates,
        },
        { onConflict: 'user_media_status_id' }
      )
      .select()
      .single();

    if (error && isMissingDbObjectError(error)) {
      return { success: false, error: 'user_game_status_details table is missing. Run DB migration.' };
    }
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving game tracking:', error);
    return { success: false, error: error.message };
  }
};

export const saveGamePlayingProgress = async (
  mediaId,
  storyProgress,
  overallProgress,
  platform = undefined
) => {
  return saveGameTracking(mediaId, { storyProgress, overallProgress, platform });
};

export const saveGameCompletionDetails = async (
  mediaId,
  {
    platform = null,
    playtimeHours = null,
    completedDlcs = [],
    overallProgress = null,
    mainStoryHours = null,
    completionistHours = null,
    status = 'watched',
    forceCompletedProgress = true,
  } = {}
) => {
  const timeBased = calculateGameProgressFromPlaytime(
    playtimeHours,
    mainStoryHours,
    completionistHours
  );

  return saveGameTracking(mediaId, {
    status,
    platform,
    playtimeHours,
    completedDlcs,
    storyCompletionTimeHours: mainStoryHours,
    totalCompletionTimeHours: completionistHours,
    storyProgress: timeBased.storyProgress,
    // User-set overall from CompletedWindow takes priority over time-based calc
    overallProgress: overallProgress != null ? overallProgress : timeBased.overallProgress,
    forceCompletedProgress,
  });
};

/**
 * Removes stale status rows that have no status and are not wishlisted.
 * Useful after migrating data or cleaning legacy rows.
 */
export const cleanupEmptyMediaStatusRows = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not logged in' };

    const { error } = await supabase
      .from('user_media_status')
      .delete()
      .eq('user_id', user.id)
      .is('status', null)
      .eq('is_wishlisted', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error cleaning stale media status rows:', error);
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
