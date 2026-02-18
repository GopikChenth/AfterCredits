import { StyleSheet, Dimensions } from 'react-native';

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║            POST DETAIL PAGE — STYLE HANDLER                   ║
 * ║                                                               ║
 * ║  Centralises all visual theming for the Post Detail page.     ║
 * ║  Each media vertical gets its own palette while sharing       ║
 * ║  the same structural layout.                                  ║
 * ║                                                               ║
 * ║  Usage:                                                       ║
 * ║    import { getPostDetailStyles, getPostDetailTheme,          ║
 * ║      COVER_WIDTH, COVER_HEIGHT }                              ║
 * ║      from '../stylehandler/postDetailStyles';                 ║
 * ║    const styles = getPostDetailStyles('anime');               ║
 * ║    const theme  = getPostDetailTheme('anime');                ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 10;
const NUM_COLUMNS = 4;
const COVER_WIDTH = (SCREEN_WIDTH - (GRID_PADDING * 2) - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;
const COVER_HEIGHT = COVER_WIDTH * 1.5;


// ╔═══════════════════════════════════════════════════════════════╗
// ║                    SHARED / BASE STYLES                       ║
// ╚═══════════════════════════════════════════════════════════════╝

const baseStyles = {
  safeArea: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GRID_PADDING,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  username: {
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#fff',
    flex: 1,
  },
  date: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 28,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 15,
    color: '#999',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridImage: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 6,
  },
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      ANIME THEME  🌸                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const animeTheme = {
  accent: '#FFB3C6',
  background: '#0D0D0D',
  avatarBg: '#2A2A2A',
  gridImageBg: '#2A2A2A',
  fontFamily: 'Agdasima',
  fontFamilyBold: 'Agdasima-Bold',
  detailsRoute: 'DetailsAnime',
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      GAMES THEME  🎮                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const gamesTheme = {
  accent: '#A78BFA',
  background: '#0F0F23',
  avatarBg: '#1E1E3F',
  gridImageBg: '#1E1E3F',
  fontFamily: 'System',
  fontFamilyBold: 'System',
  detailsRoute: 'DetailsAnime', // TODO: Create DetailsGame page
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
    avatar: {
      ...baseStyles.avatar,
      backgroundColor: theme.avatarBg,
    },
    username: {
      ...baseStyles.username,
      fontFamily: theme.fontFamily,
    },
    date: {
      ...baseStyles.date,
      fontFamily: theme.fontFamily,
    },
    title: {
      ...baseStyles.title,
      fontFamily: theme.fontFamilyBold,
    },
    description: {
      ...baseStyles.description,
      fontFamily: theme.fontFamily,
    },
    gridImage: {
      ...baseStyles.gridImage,
      backgroundColor: theme.gridImageBg,
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
export const getPostDetailStyles = (mediaType = 'anime') => {
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
export const getPostDetailTheme = (mediaType = 'anime') => {
  return THEME_MAP[mediaType] || THEME_MAP.anime;
};

export { COVER_WIDTH, COVER_HEIGHT, NUM_COLUMNS, GRID_PADDING, GRID_GAP };
