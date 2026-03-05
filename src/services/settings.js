import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@aftercredits_settings';

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
