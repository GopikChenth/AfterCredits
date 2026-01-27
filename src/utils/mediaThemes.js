/**
 * Media Theme Configuration
 * Defines color schemes for different media types
 */

export const MEDIA_THEMES = {
  anime: {
    name: 'Anime',
    accent: '#007AFF',      // iOS Blue - vibrant and modern
    accentLight: 'rgba(0, 122, 255, 0.15)',
    accentGlow: 'rgba(0, 122, 255, 0.3)',
  },
  movie: {
    name: 'Movies',
    accent: '#FF3B30',      // Cinematic Red
    accentLight: 'rgba(255, 59, 48, 0.15)',
    accentGlow: 'rgba(255, 59, 48, 0.3)',
  },
  game: {
    name: 'Games',
    accent: '#34C759',      // Gaming Green
    accentLight: 'rgba(52, 199, 89, 0.15)',
    accentGlow: 'rgba(52, 199, 89, 0.3)',
  },
  comic: {
    name: 'Comics',
    accent: '#FF9500',      // Comic Orange
    accentLight: 'rgba(255, 149, 0, 0.15)',
    accentGlow: 'rgba(255, 149, 0, 0.3)',
  },
  manga: {
    name: 'Manga',
    accent: '#AF52DE',      // Manga Purple
    accentLight: 'rgba(175, 82, 222, 0.15)',
    accentGlow: 'rgba(175, 82, 222, 0.3)',
  },
};

/**
 * Get theme configuration for a media type
 * @param {string} mediaType - Type of media (anime, movie, game, comic, manga)
 * @returns {object} Theme configuration object
 */
export const getMediaTheme = (mediaType = 'anime') => {
  return MEDIA_THEMES[mediaType] || MEDIA_THEMES.anime;
};

/**
 * Get all available media types
 * @returns {string[]} Array of media type keys
 */
export const getMediaTypes = () => {
  return Object.keys(MEDIA_THEMES);
};
