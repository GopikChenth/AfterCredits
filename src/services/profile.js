import { supabase } from './supabase';

/**
 * Profile Service - Handles user profile operations
 */

// Get current user's profile
export const getUserProfile = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      // If auth session is missing, user is not logged in (this is normal)
      if (userError.message?.includes('Auth session missing')) {
        return { success: false, error: 'Not logged in', notLoggedIn: true };
      }
      throw userError;
    }
    
    if (!user) return { success: false, error: 'Not logged in', notLoggedIn: true };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return { success: true, profile: data };
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, error: error.message };
  }
};

// Update user profile
export const updateProfile = async (updates) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) return { success: false, error: 'Not logged in' };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, profile: data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
};

// Update anonymous mode preference
export const updateAnonymousMode = async (useDisplayName) => {
  return updateProfile({ use_display_name: useDisplayName });
};
