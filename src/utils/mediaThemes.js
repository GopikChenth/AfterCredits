import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

/**
 * Font Loading Configuration
 * Centralized font management for all media types
 * 
 * NOTE: Custom fonts temporarily disabled - uncomment when font files are added to src/assets/fonts/
 */
const FONT_MAP = {
  // 'Midorima': require('../assets/fonts/Midorima-PersonalUse-Regular.ttf'),
  // 'Agdasima': require('../assets/fonts/Agdasima-Regular.ttf'),
  // 'Agdasima-Bold': require('../assets/fonts/Agdasima-Bold.ttf'),
};

/**
 * Custom hook for loading all media theme fonts
 * @returns {boolean} Whether fonts are loaded
 */
export const useMediaFonts = () => {
  // Temporarily return true since we're using system fonts
  return true;
  
  /* 
  // Uncomment when custom fonts are available:
  const [fontsLoaded] = useFonts(FONT_MAP);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return fontsLoaded;
  */
};

/**
 * Initialize font loading system
 * Call this before rendering any components
 */
export const initializeFonts = () => {
  // Temporarily disabled - using system fonts
  // SplashScreen.preventAutoHideAsync();
};

/**
 * Media Theme Configuration
 * Defines color schemes for different media types
 */

export const MEDIA_THEMES = {
  anime: {
    name: 'Anime',
    accent: '#FFB3C6',      // Pastel Cherry Blossom
    accentLight: '#FFE5EC', // Light Pastel Pink
    accentGlow: 'rgba(255, 179, 198, 0.6)',
    // Temporarily using system fonts - switch to custom when available:
    // headingFont: 'Midorima',
    // contentFont: 'Agdasima',
    headingFont: 'System',
    contentFont: 'System',
  },
  movie: {
    name: 'Movies',
    accent: '#FF9AA2',      // Pastel Red/Coral
    accentLight: '#FFDAC1', // Pastel Peach
    accentGlow: 'rgba(255, 154, 162, 0.6)',
    headingFont: 'Arial',
    contentFont: 'Arial',
  },
  game: {
    name: 'Games',
    accent: '#B5EAD7',      // Pastel Mint Green
    accentLight: '#E2F0CB', // Pastel Yellow-Green
    accentGlow: 'rgba(181, 234, 215, 0.6)',
    headingFont: 'Arial',
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
