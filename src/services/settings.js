import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@aftercredits_settings';
const SIDEBAR_SECTION_IDS = ['anime', 'movies', 'games', 'comics', 'manga'];

/**
 * Default settings for the app
 */
const DEFAULT_SETTINGS = {
  showAnime: true,
  showMovies: true,
  showGames: true,
  showComics: false,
  showManga: false,
  sidebarOrder: SIDEBAR_SECTION_IDS,
  theme: 'dark',
  language: 'en',
};

/**
 * Comics and manga are not available yet.
 * Keep them hard-disabled in persisted settings.
 */
const normalizeLockedMediaSettings = (settings) => ({
  ...normalizeSidebarOrder(settings),
  showComics: false,
  showManga: false,
});

const normalizeSidebarOrder = (settings) => {
  const incoming = Array.isArray(settings?.sidebarOrder) ? settings.sidebarOrder : [];
  const uniqueValid = [];
  incoming.forEach((id) => {
    if (SIDEBAR_SECTION_IDS.includes(id) && !uniqueValid.includes(id)) {
      uniqueValid.push(id);
    }
  });
  const missing = SIDEBAR_SECTION_IDS.filter((id) => !uniqueValid.includes(id));
  return {
    ...settings,
    sidebarOrder: [...uniqueValid, ...missing],
  };
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
      return normalizeLockedMediaSettings({ ...DEFAULT_SETTINGS, ...settings });
    }
    
    return normalizeLockedMediaSettings(DEFAULT_SETTINGS);
  } catch (error) {
    console.error('Error loading settings:', error);
    return normalizeLockedMediaSettings(DEFAULT_SETTINGS);
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
    const newSettings = normalizeLockedMediaSettings({ ...currentSettings, ...updates });
    
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
  if (mediaType === 'comics' || mediaType === 'manga') {
    return await updateSettings({ showComics: false, showManga: false });
  }
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
    const normalizedDefaults = normalizeLockedMediaSettings(DEFAULT_SETTINGS);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizedDefaults));
    return { success: true, settings: normalizedDefaults };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, error: error.message };
  }
};
