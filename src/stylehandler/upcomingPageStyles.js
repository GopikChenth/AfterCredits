import { StyleSheet, Dimensions } from 'react-native';

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║            UPCOMING PAGE — STYLE HANDLER                      ║
 * ║                                                               ║
 * ║  Centralises all visual theming for the Upcoming page.        ║
 * ║  Each media vertical gets its own palette while sharing       ║
 * ║  the same structural layout.                                  ║
 * ║                                                               ║
 * ║  Usage:                                                       ║
 * ║    import { getUpcomingPageStyles, getUpcomingPageTheme,      ║
 * ║      CARD_WIDTH, CARD_HEIGHT, EXPANDED_WIDTH }                ║
 * ║      from '../stylehandler/upcomingPageStyles';               ║
 * ║    const styles = getUpcomingPageStyles('anime');             ║
 * ║    const theme  = getUpcomingPageTheme('anime');              ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const EXPANDED_WIDTH = width - 40;


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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  // Card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  // Expanded overlay
  expandedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    justifyContent: 'flex-end',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expandedHeader: {
    marginBottom: 12,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  expandedContent: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#ccc',
    letterSpacing: 0.2,
    flex: 1,
  },
  expandedDescription: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 0.2,
    lineHeight: 15,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  wishlistButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Loading
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
  cardBg: '#1A1A1A',
  cardImageBg: '#2A2A2A',
  cardBorder: 'rgba(255,255,255,0.06)',
  wishlistBg: 'rgba(167, 139, 250, 0.1)',
  wishlistBorder: 'rgba(167, 139, 250, 0.3)',
  wishlistActiveBg: 'rgba(167, 139, 250, 0.25)',
  wishlistActiveBorder: 'rgba(167, 139, 250, 0.5)',
  wishlistIcon: '#C4B5FD',
  detailsBg: 'rgba(167, 139, 250, 0.15)',
  gradientOverlay: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.98)'],
  fontFamily: 'Agdasima',
  headerTitle: 'Upcoming Anime',
  headerSubtitle: 'Sorted by nearest release',
  detailsRoute: 'DetailsAnime',
  mediaKey: 'anime',
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      GAMES THEME  🎮                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const gamesTheme = {
  accent: '#4ADE80',
  background: '#070F0A',
  backButtonBg: '#0F1F14',
  cardBg: '#0F1F14',
  cardImageBg: '#0F1F14',
  cardBorder: 'rgba(74, 222, 128, 0.15)',
  wishlistBg: 'rgba(74, 222, 128, 0.1)',
  wishlistBorder: 'rgba(74, 222, 128, 0.3)',
  wishlistActiveBg: 'rgba(74, 222, 128, 0.25)',
  wishlistActiveBorder: 'rgba(74, 222, 128, 0.5)',
  wishlistIcon: '#4ADE80',
  detailsBg: 'rgba(74, 222, 128, 0.15)',
  gradientOverlay: ['rgba(7,15,10,0.2)', 'rgba(7,15,10,0.8)', 'rgba(7,15,10,0.98)'],
  fontFamily: 'System',
  headerTitle: 'Upcoming Games',
  headerSubtitle: 'Sorted by nearest release',
  detailsRoute: 'DetailsAnime', // TODO: Create DetailsGame page
  mediaKey: 'games',
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                     MOVIES THEME  🎬                          ║
// ║    Theme: Sunset — warm amber, burnt orange, deep charcoal    ║
// ╚═══════════════════════════════════════════════════════════════╝

const moviesTheme = {
  accent: '#FF6B35',
  background: '#0E0A07',
  backButtonBg: '#1F1209',
  cardBg: '#1F1209',
  cardImageBg: '#2A1A0E',
  cardBorder: 'rgba(255, 107, 53, 0.15)',
  wishlistBg: 'rgba(255, 179, 71, 0.1)',
  wishlistBorder: 'rgba(255, 179, 71, 0.3)',
  wishlistActiveBg: 'rgba(255, 179, 71, 0.25)',
  wishlistActiveBorder: 'rgba(255, 179, 71, 0.5)',
  wishlistIcon: '#FFB347',
  detailsBg: 'rgba(255, 107, 53, 0.15)',
  gradientOverlay: ['rgba(14,10,7,0.2)', 'rgba(14,10,7,0.8)', 'rgba(14,10,7,0.98)'],
  fontFamily: 'System',
  headerTitle: 'Upcoming Movies',
  headerSubtitle: 'Sorted by nearest release',
  detailsRoute: 'DetailsAnime', // TODO: replace with DetailsMovies
  mediaKey: 'movies',
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
    card: {
      ...baseStyles.card,
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
    },
    cardImage: {
      ...baseStyles.cardImage,
      backgroundColor: theme.cardImageBg,
    },
    expandedTitle: {
      ...baseStyles.expandedTitle,
      fontFamily: theme.fontFamily,
    },
    infoText: {
      ...baseStyles.infoText,
      fontFamily: theme.fontFamily,
    },
    expandedDescription: {
      ...baseStyles.expandedDescription,
      fontFamily: theme.fontFamily,
    },
    wishlistButton: {
      ...baseStyles.wishlistButton,
      backgroundColor: theme.wishlistBg,
      borderColor: theme.wishlistBorder,
    },
    wishlistButtonActive: {
      backgroundColor: theme.wishlistActiveBg,
      borderColor: theme.wishlistActiveBorder,
    },
    viewDetailsButton: {
      ...baseStyles.viewDetailsButton,
      backgroundColor: theme.detailsBg,
    },
    viewDetailsText: {
      ...baseStyles.viewDetailsText,
      fontFamily: theme.fontFamily,
      color: theme.accent,
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
 * Get the themed StyleSheet for the Upcoming page.
 * @param {'anime' | 'games' | 'movies'} mediaType
 * @returns {StyleSheet}
 */
export const getUpcomingPageStyles = (mediaType = 'anime') => {
  const key = THEME_MAP[mediaType] ? mediaType : 'anime';
  if (!styleCache[key]) {
    styleCache[key] = buildStyles(THEME_MAP[key]);
  }
  return styleCache[key];
};

/**
 * Get the raw theme tokens for the Upcoming page.
 * @param {'anime' | 'games' | 'movies'} mediaType
 * @returns {object}
 */
export const getUpcomingPageTheme = (mediaType = 'anime') => {
  return THEME_MAP[mediaType] || THEME_MAP.anime;
};

export { CARD_WIDTH, CARD_HEIGHT, EXPANDED_WIDTH };
