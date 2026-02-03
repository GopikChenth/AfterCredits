import { supabase } from './supabase';

/**
 * Auth Service - Handles all authentication operations
 */

// Check if callsign (display_name) is available
export const checkUsernameAvailability = async (callsign) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('display_name', callsign)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned - callsign is available
      return { available: true };
    }

    if (error) throw error;

    // Callsign already exists
    return { available: false };
  } catch (error) {
    console.error('Callsign check error:', error);
    return { available: false, error: error.message };
  }
};

// Sign up with email and password
export const signUp = async (email, password, username, displayName = '') => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          display_name: displayName || username, // Fallback to username if no display name
        },
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message };
  }
};

// Login with email and password
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { success: true, user };
  } catch (error) {
    console.error('Get user error:', error);
    return { success: false, error: error.message };
  }
};

// Get current session
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, session };
  } catch (error) {
    console.error('Get session error:', error);
    return { success: false, error: error.message };
  }
};

// Password reset - Send reset email
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'aftercredits://reset-password',
    });

    if (error) throw error;
    return { success: true, message: 'Password reset email sent!' };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
};

// Update password
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { success: true, message: 'Password updated successfully!' };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, error: error.message };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Sign in with Google (OAuth)
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { success: false, error: error.message };
  }
};

// Sign in with Apple (OAuth)
export const signInWithApple = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Apple sign in error:', error);
    return { success: false, error: error.message };
  }
};

// Sign in with Facebook (OAuth)
export const signInWithFacebook = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Facebook sign in error:', error);
    return { success: false, error: error.message };
  }
};
