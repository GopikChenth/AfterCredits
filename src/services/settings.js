import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@aftercredits_settings';
const IGDB_CREDENTIALS_KEY = '@aftercredits_igdb_credentials';

/**
 * Default settings for the app
 */
const DEFAULT_SETTINGS = {
  showAnime: true,
  showMovies: true,
  showGames: true,
  showComics: true,
  showManga: true,
  theme: 'dark',
  language: 'en',
};

/**
 * Get all user settings
 * @returns {Promise<Object>} Settings object
 */
export const getSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_SETTINGS, ...settings };
    }
    
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Update specific settings
 * @param {Object} updates - Settings to update
 * @returns {Promise<Object>} Updated settings object
 */
export const updateSettings = async (updates) => {
  try {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...updates };
    
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    
    return { success: true, settings: newSettings };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle a specific media type visibility
 * @param {string} mediaType - 'anime', 'movies', 'games', 'comics', 'manga'
 * @param {boolean} value - true to show, false to hide
 * @returns {Promise<Object>} Result object
 */
export const toggleMediaVisibility = async (mediaType, value) => {
  const key = `show${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;
  return await updateSettings({ [key]: value });
};

/**
 * Get visible media types
 * @returns {Promise<string[]>} Array of visible media type IDs
 */
export const getVisibleMediaTypes = async () => {
  const settings = await getSettings();
  const visibleTypes = [];
  
  if (settings.showAnime) visibleTypes.push('anime');
  if (settings.showMovies) visibleTypes.push('movies');
  if (settings.showGames) visibleTypes.push('games');
  if (settings.showComics) visibleTypes.push('comics');
  if (settings.showManga) visibleTypes.push('manga');
  
  return visibleTypes;
};

/**
 * Reset settings to default
 * @returns {Promise<Object>} Result object
 */
export const resetSettings = async () => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return { success: true, settings: DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// IGDB CREDENTIALS  (user-supplied Client ID + Access Token)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get user-supplied IGDB credentials.
 * Returns { clientId: string, accessToken: string } — both may be empty strings.
 */
export const getIGDBCredentials = async () => {
  try {
    const raw = await AsyncStorage.getItem(IGDB_CREDENTIALS_KEY);
    if (raw) return JSON.parse(raw);
    return { clientId: '', accessToken: '' };
  } catch (error) {
    console.error('Error loading IGDB credentials:', error);
    return { clientId: '', accessToken: '' };
  }
};

/**
 * Save user-supplied IGDB credentials.
 * @param {{ clientId: string, accessToken: string }} credentials
 */
export const saveIGDBCredentials = async ({ clientId, accessToken }) => {
  try {
    await AsyncStorage.setItem(
      IGDB_CREDENTIALS_KEY,
      JSON.stringify({ clientId: clientId.trim(), accessToken: accessToken.trim() })
    );
    return { success: true };
  } catch (error) {
    console.error('Error saving IGDB credentials:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Returns true if the user has supplied non-empty IGDB credentials.
 */
export const hasIGDBCredentials = async () => {
  const { clientId, accessToken } = await getIGDBCredentials();
  return clientId.length > 0 && accessToken.length > 0;
};
