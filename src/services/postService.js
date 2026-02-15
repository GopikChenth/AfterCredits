import { supabase } from './supabase';

/**
 * Fetch all posts from Supabase, ordered by newest first.
 * Maps snake_case DB columns to camelCase for the app.
 */
export const getPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
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
      animeCovers: row.anime_covers || [],
      createdAt: row.created_at,
    }));

    return { success: true, data: posts };
  } catch (err) {
    console.error('Unexpected error fetching posts:', err);
    return { success: false, data: [], error: err.message };
  }
};
