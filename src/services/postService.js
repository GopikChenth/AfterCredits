import { supabase } from './supabase';

/**
 * Fetch posts from Supabase filtered by media type, ordered by newest first.
 * Maps snake_case DB columns to camelCase for the app.
 *
 * @param {'anime' | 'games' | 'movies'} mediaType - The active subapp media type
 */
export const getPosts = async (mediaType = 'anime') => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('media_type', mediaType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error.message);
      return { success: false, data: [], error: error.message };
    }

    // Map DB columns (snake_case) to app format (camelCase)
    const posts = (data || []).map(row => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      date: row.date,
      title: row.title,
      description: row.description,
      mediaCovers: (row.media_covers || []).map((cover) =>
        typeof cover === 'string' ? { imageUrl: cover } : cover
      ),
      createdAt: row.created_at,
    }));

    return { success: true, data: posts };
  } catch (err) {
    console.error('Unexpected error fetching posts:', err);
    return { success: false, data: [], error: err.message };
  }
};
