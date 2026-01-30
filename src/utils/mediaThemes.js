import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

/**
 * Font Loading Configuration
 * Centralized font management for all media types
 */
const FONT_MAP = {
  'Midorima': require('../assets/fonts/Midorima-PersonalUse-Regular.ttf'),
  'Agdasima': require('../assets/fonts/Agdasima-Regular.ttf'),
  'Agdasima-Bold': require('../assets/fonts/Agdasima-Bold.ttf'),
};

/**
 * Custom hook for loading all media theme fonts
 * @returns {boolean} Whether fonts are loaded
 */
export const useMediaFonts = () => {
  const [fontsLoaded] = useFonts(FONT_MAP);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return fontsLoaded;
};

/**
 * Initialize font loading system
 * Call this before rendering any components
 */
export const initializeFonts = () => {
  SplashScreen.preventAutoHideAsync();
};

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
    headingFont: 'Midorima',
    contentFont: 'Agdasima',
  },
  movie: {
    name: 'Movies',
    accent: '#FF3B30',      // Cinematic Red
    accentLight: 'rgba(255, 59, 48, 0.15)',
    accentGlow: 'rgba(255, 59, 48, 0.3)',
    headingFont: 'Arial',
    contentFont: 'Arial',
  },
  game: {
    name: 'Games',
    accent: '#34C759',      // Gaming Green
    accentLight: 'rgba(52, 199, 89, 0.15)',
    accentGlow: 'rgba(52, 199, 89, 0.3)',
    headingFont: 'Arial',
    contentFont: 'Arial',
  },
  comic: {
    name: 'Comics',
    accent: '#FF9500',      // Comic Orange
    accentLight: 'rgba(255, 149, 0, 0.15)',
    accentGlow: 'rgba(255, 149, 0, 0.3)',
    headingFont: 'Arial',
    contentFont: 'Arial',
  },
  manga: {
    name: 'Manga',
    accent: '#AF52DE',      // Manga Purple
    accentLight: 'rgba(175, 82, 222, 0.15)',
    accentGlow: 'rgba(175, 82, 222, 0.3)',
    headingFont: 'Arial',
    contentFont: 'Arial',
  },
};

/**
 * Get theme configuration for a media type
 * @param {string} mediaType - Type of media (anime, movie, game, comic, manga)
 * @returns {object} Theme configuration object with font utilities
 */
export const getMediaTheme = (mediaType = 'anime') => {
  const theme = MEDIA_THEMES[mediaType] || MEDIA_THEMES.anime;
  
  return {
    ...theme,
    fonts: {
      heading: (weight = 'normal') => {
        const baseFont = theme.headingFont;
        if (baseFont === 'Agdasima' && weight === 'bold') {
          return { fontFamily: 'Agdasima-Bold' };
        }
        return {
          fontFamily: baseFont,
          fontWeight: weight === 'bold' ? 'bold' : 'normal',
        };
      },
      content: (weight = 'normal') => {
        const baseFont = theme.contentFont;
        if (baseFont === 'Agdasima' && weight === 'bold') {
          return { fontFamily: 'Agdasima-Bold' };
        }
        return {
          fontFamily: baseFont,
          fontWeight: weight === 'bold' ? 'bold' : 'normal',
        };
      },
    }
  };
};

/**
 * Get all available media types
 * @returns {string[]} Array of media type keys
 */
export const getMediaTypes = () => {
  return Object.keys(MEDIA_THEMES);
};
