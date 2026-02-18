import { StyleSheet } from 'react-native';

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║               POST PAGE — STYLE HANDLER                       ║
 * ║                                                               ║
 * ║  Centralises all visual theming for the Post feed page.       ║
 * ║  Each media vertical gets its own palette while sharing       ║
 * ║  the same structural layout.                                  ║
 * ║                                                               ║
 * ║  Usage:                                                       ║
 * ║    import { getPostPageStyles, getPostPageTheme }             ║
 * ║      from '../stylehandler/postPageStyles';                   ║
 * ║    const styles = getPostPageStyles('anime');                 ║
 * ║    const theme  = getPostPageTheme('anime');                  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */


// ╔═══════════════════════════════════════════════════════════════╗
// ║                    SHARED / BASE STYLES                       ║
// ╚═══════════════════════════════════════════════════════════════╝

const baseStyles = {
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 10,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
  },
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      ANIME THEME  🌸                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const animeTheme = {
  accent: '#FFB3C6',
  background: '#0D0D0D',
  profileIconColor: '#FFB3C6',
  fontFamily: 'Agdasima',
  headerTitle: 'Post',
  headerSubtitle: 'Curated anime lists from the community',
  detailRoute: 'PostDetailAnime',
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      GAMES THEME  🎮                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const gamesTheme = {
  accent: '#A78BFA',
  background: '#0F0F23',
  profileIconColor: '#A78BFA',
  fontFamily: 'System',
  headerTitle: 'Post',
  headerSubtitle: 'Curated game lists from the community',
  detailRoute: 'PostDetailAnime', // Shared detail page
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                    THEME MAP & REGISTRY                       ║
// ╚═══════════════════════════════════════════════════════════════╝

const THEME_MAP = {
  anime: animeTheme,
  games: gamesTheme,
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║               STYLE BUILDER  (Theme → StyleSheet)             ║
// ╚═══════════════════════════════════════════════════════════════╝

const buildStyles = (theme) =>
  StyleSheet.create({
    ...baseStyles,

    safeArea: {
      ...baseStyles.safeArea,
      backgroundColor: theme.background,
    },
    container: {
      ...baseStyles.container,
      backgroundColor: theme.background,
    },
    profileIcon: {
      ...baseStyles.profileIcon,
      backgroundColor: theme.accent,
    },
    headerTitle: {
      ...baseStyles.headerTitle,
      fontFamily: theme.fontFamily,
    },
    headerSubtitle: {
      ...baseStyles.headerSubtitle,
      fontFamily: theme.fontFamily,
    },
    errorText: {
      ...baseStyles.errorText,
      fontFamily: theme.fontFamily,
    },
    retryButton: {
      ...baseStyles.retryButton,
      backgroundColor: theme.accent,
    },
    retryText: {
      ...baseStyles.retryText,
      color: theme.background,
      fontFamily: theme.fontFamily,
    },
  });


// ╔═══════════════════════════════════════════════════════════════╗
// ║                   CACHE & PUBLIC API                           ║
// ╚═══════════════════════════════════════════════════════════════╝

const styleCache = {};

/**
 * @param {'anime' | 'games'} mediaType
 * @returns {StyleSheet}
 */
export const getPostPageStyles = (mediaType = 'anime') => {
  const key = THEME_MAP[mediaType] ? mediaType : 'anime';
  if (!styleCache[key]) {
    styleCache[key] = buildStyles(THEME_MAP[key]);
  }
  return styleCache[key];
};

/**
 * @param {'anime' | 'games'} mediaType
 * @returns {object}
 */
export const getPostPageTheme = (mediaType = 'anime') => {
  return THEME_MAP[mediaType] || THEME_MAP.anime;
};
