/**
 * User Utilities - Helper functions for user profile data
 */

/**
 * Get the user's public display name based on privacy settings
 * @param {Object} profile - User profile object
 *   - username: Real name (public by default)
 *   - display_name: Callsign (anonymous option)
 *   - use_display_name: Privacy toggle (true = show callsign, false = show real name)
 * @returns {string} - The name to display publicly
 */
export const getPublicName = (profile) => {
  if (!profile) return 'Anonymous';
  
  // If user wants anonymous mode AND has a callsign set
  if (profile.use_display_name && profile.display_name) {
    return profile.display_name; // Show callsign (e.g., "Maverick")
  }
  
  // Otherwise show real name (default public)
  return profile.username || 'User'; // Show real name (e.g., "John Doe")
};

/**
 * Get user's first name from username (real name)
 * @param {Object} profile - User profile object
 * @returns {string} - First name
 */
export const getFirstName = (profile) => {
  if (!profile || !profile.username) return 'User';
  
  // Username is real name, extract first word
  const realName = profile.username;
  
  if (realName.includes(' ')) {
    return realName.split(' ')[0];
  }
  
  return realName;
};
