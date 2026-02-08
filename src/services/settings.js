import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({
  id: 'aftercredits-settings',
});

const SETTINGS_KEY = 'settings';

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
 * @returns {Object} Settings object
 */
export const getSettings = () => {
  try {
    const settingsJson = storage.getString(SETTINGS_KEY);
    
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
 * @returns {Object} Updated settings object
 */
export const updateSettings = (updates) => {
  try {
    const currentSettings = getSettings();
    const newSettings = { ...currentSettings, ...updates };
    
    storage.set(SETTINGS_KEY, JSON.stringify(newSettings));
    
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
 * @returns {Object} Result object
 */
export const toggleMediaVisibility = (mediaType, value) => {
  const key = `show${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;
  return updateSettings({ [key]: value });
};

/**
 * Get visible media types
 * @returns {string[]} Array of visible media type IDs
 */
export const getVisibleMediaTypes = () => {
  const settings = getSettings();
  const visibleTypes = [];
  
  if (settings.showAnime) visibleTypes.push('anime');
  if (settings.showMovies) visibleTypes.push('movie');
  if (settings.showGames) visibleTypes.push('game');
  if (settings.showComics) visibleTypes.push('comic');
  if (settings.showManga) visibleTypes.push('manga');
  
  return visibleTypes;
};

/**
 * Reset settings to default
 * @returns {Object} Result object
 */
export const resetSettings = () => {
  try {
    storage.set(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return { success: true, settings: DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, error: error.message };
  }
};
