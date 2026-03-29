import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

/**
 * Font Loading Configuration
 * Centralized font management for all media types
 */
const FONT_MAP = {
  'Agdasima': require('../../assets/font/Agdasima-Regular.ttf'),
  'Agdasima-Bold': require('../../assets/font/Agdasima-Bold.ttf'),
  'Genjiro': require('../../assets/font/Genjiro.ttf'),
  'NinjaNaruto': require('../../assets/font/NinjaNaruto-YOn4.ttf'),
  'Blackbots': require('../../assets/font/Blackbots.ttf'),
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
    accent: '#A78BFA',      // Violet Night
    accentLight: '#C4B5FD', // Light Lavender
    accentGlow: 'rgba(167, 139, 250, 0.6)',
    headingFont: 'Agdasima',
    contentFont: 'Agdasima',
  },
  movie: {
    name: 'Movies',
    accent: '#FF6B35',      // Sunset Orange
    accentLight: '#FFB347', // Amber
    accentGlow: 'rgba(255, 107, 53, 0.6)',
    headingFont: 'Arial',
    contentFont: 'Arial',
  },
  game: {
    name: 'Games',
    accent: '#0FA3B1',      // Cyan
    accentLight: '#22D3EE', // Light Cyan
    accentGlow: 'rgba(15, 163, 177, 0.6)',
    headingFont: 'Blackbots',
    contentFont: 'Arial',
  },
  comic: {
    name: 'Comics',
    accent: '#FFDAC1',      // Pastel Peach/Orange
    accentLight: '#FFF0E4', // Very Light Peach
    accentGlow: 'rgba(255, 218, 193, 0.6)',
    headingFont: 'Arial',
    contentFont: 'Arial',
  },
  manga: {
    name: 'Manga',
    accent: '#C7CEEA',      // Pastel Periwinkle
    accentLight: '#E8DFF5', // Pastel Lavender
    accentGlow: 'rgba(199, 206, 234, 0.6)',
    headingFont: 'Arial',
    contentFont: 'Arial',
  },
};

/**
 * Get theme configuration for a media type
 * @param {string} mediaType - Type of media (anime, movie, game, comic, manga)
 * @returns {object} Theme configuration object with font utilities
 */
// Module-level cache so the returned object (including font functions) is stable
// across repeated calls with the same mediaType — avoids re-creating functions
// on every render for callers that can't useMemo.
const _themeCache = {};

export const getMediaTheme = (mediaType = 'anime') => {
  if (_themeCache[mediaType]) return _themeCache[mediaType];

  const theme = MEDIA_THEMES[mediaType] || MEDIA_THEMES.anime;
  
  const result = {
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

  _themeCache[mediaType] = result;
  return result;
};

/**
 * Get all available media types
 * @returns {string[]} Array of media type keys
 */
export const getMediaTypes = () => {
  return Object.keys(MEDIA_THEMES);
};
