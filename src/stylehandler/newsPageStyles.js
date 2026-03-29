import { StyleSheet } from 'react-native';

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              NEWS PAGE — STYLE HANDLER                        ║
 * ║                                                               ║
 * ║  Centralises all visual theming for the News page.            ║
 * ║  Each media vertical gets its own palette while sharing       ║
 * ║  the same structural layout.                                  ║
 * ║                                                               ║
 * ║  Usage:                                                       ║
 * ║    import { getNewsPageStyles, getNewsPageTheme }             ║
 * ║      from '../stylehandler/newsPageStyles';                   ║
 * ║    const styles = getNewsPageStyles('anime');                 ║
 * ║    const theme  = getNewsPageTheme('anime');                  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */


// ╔═══════════════════════════════════════════════════════════════╗
// ║                    SHARED / BASE STYLES                       ║
// ╚═══════════════════════════════════════════════════════════════╝

const baseStyles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      ANIME THEME  💜                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const animeTheme = {
  accent: '#A78BFA',
  background: '#0D0D0D',
  backButtonBg: '#1A1A1A',
  fontFamily: 'Agdasima',
  headerTitle: 'Anime News',
  headerSubtitle: 'Latest updates from Anime Corner',
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      GAMES THEME  🎮                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const gamesTheme = {
  accent: '#0FA3B1',
  background: '#070B0F',
  backButtonBg: '#0A161C',
  fontFamily: 'System',
  headerTitle: 'Gaming News',
  headerSubtitle: 'Latest updates from Insider Gaming',
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                     MOVIES THEME  🎬                          ║
// ║    Theme: Sunset — warm amber, burnt orange, deep charcoal    ║
// ╚═══════════════════════════════════════════════════════════════╝

const moviesTheme = {
  accent: '#FF6B35',
  background: '#0E0A07',
  backButtonBg: '#1F1209',
  fontFamily: 'System',
  headerTitle: 'Movie News',
  headerSubtitle: 'Latest updates from the film world',
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                    THEME MAP & REGISTRY                       ║
// ╚═══════════════════════════════════════════════════════════════╝

const THEME_MAP = {
  anime: animeTheme,
  games: gamesTheme,
  movies: moviesTheme,
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║               STYLE BUILDER  (Theme → StyleSheet)             ║
// ╚═══════════════════════════════════════════════════════════════╝

const buildStyles = (theme) =>
  StyleSheet.create({
    ...baseStyles,

    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      ...baseStyles.container,
      backgroundColor: theme.background,
    },
    backButton: {
      ...baseStyles.backButton,
      backgroundColor: theme.backButtonBg,
    },
    headerTitle: {
      ...baseStyles.headerTitle,
      fontFamily: theme.fontFamily,
    },
    headerSubtitle: {
      ...baseStyles.headerSubtitle,
      fontFamily: theme.fontFamily,
    },
    loadingText: {
      ...baseStyles.loadingText,
      fontFamily: theme.fontFamily,
    },
  });


// ╔═══════════════════════════════════════════════════════════════╗
// ║                   CACHE & PUBLIC API                           ║
// ╚═══════════════════════════════════════════════════════════════╝

const styleCache = {};

/**
 * Get the themed StyleSheet for the News page.
 * @param {'anime' | 'games' | 'movies'} mediaType
 * @returns {StyleSheet}
 */
export const getNewsPageStyles = (mediaType = 'anime') => {
  const key = THEME_MAP[mediaType] ? mediaType : 'anime';
  if (!styleCache[key]) {
    styleCache[key] = buildStyles(THEME_MAP[key]);
  }
  return styleCache[key];
};

/**
 * Get the raw theme tokens for the News page.
 * @param {'anime' | 'games' | 'movies'} mediaType
 * @returns {object}
 */
export const getNewsPageTheme = (mediaType = 'anime') => {
  return THEME_MAP[mediaType] || THEME_MAP.anime;
};
