import { StyleSheet, Dimensions } from 'react-native';

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              DISCOVER PAGE — STYLE HANDLER                   ║
 * ║                                                               ║
 * ║  Centralises all visual theming for the Discover page.        ║
 * ║  Each media vertical gets its own palette while sharing       ║
 * ║  the same structural layout.                                  ║
 * ║                                                               ║
 * ║  Usage:                                                       ║
 * ║    import { getDiscoverStyles, getDiscoverTheme }             ║
 * ║      from '../stylehandler/discoverStyles';                   ║
 * ║    const styles = getDiscoverStyles('anime');                 ║
 * ║    const theme  = getDiscoverTheme('anime');                  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.32;
const CARD_HEIGHT = CARD_WIDTH * 1.3;
const EXPANDED_CARD_WIDTH = width - 40;


// ╔═══════════════════════════════════════════════════════════════╗
// ║                    SHARED / BASE STYLES                       ║
// ║          Structural layout — media-type agnostic              ║
// ╚═══════════════════════════════════════════════════════════════╝

const baseStyles = {
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 10,
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
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 14,
    alignItems: 'flex-start',
  },
  flatList: {
    flexGrow: 0,
  },
  newsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardExpanded: {
    width: EXPANDED_CARD_WIDTH,
    height: CARD_HEIGHT * 1.5,
    zIndex: 1000,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
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
  expandedContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  // News Card Base Styles
  newsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  newsImage: {
    width: '100%',
    height: 180,
  },
  newsImagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsContent: {
    padding: 14,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newsCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newsLinkIcon: {
    marginLeft: 'auto',
  },
};


// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                                                               ┃
// ┃     █████╗ ███╗   ██╗██╗███╗   ███╗███████╗                   ┃
// ┃    ██╔══██╗████╗  ██║██║████╗ ████║██╔════╝                   ┃
// ┃    ███████║██╔██╗ ██║██║██╔████╔██║█████╗                     ┃
// ┃    ██╔══██║██║╚██╗██║██║██║╚██╔╝██║██╔══╝                     ┃
// ┃    ██║  ██║██║ ╚████║██║██║ ╚═╝ ██║███████╗                   ┃
// ┃    ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚══════╝                   ┃
// ┃                                                               ┃
// ┃    Theme: Pastel Cherry Blossom  🌸                           ┃
// ┃    Palette: #FFB3C6 · #FFE5EC · #D4BBFF                      ┃
// ┃    Font: Agdasima                                             ┃
// ┃                                                               ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const animeTheme = {
  accent: '#FFB3C6',
  accentLight: 'rgba(255, 179, 198, 0.1)',
  accentBorder: 'rgba(255, 179, 198, 0.3)',
  background: '#0D0D0D',
  cardBg: '#1A1A1A',
  cardImageBg: '#2A2A2A',
  cardBorder: 'rgba(255,255,255,0.06)',
  wishlistBg: 'rgba(212, 187, 255, 0.1)',
  wishlistBorder: 'rgba(212, 187, 255, 0.3)',
  wishlistActiveBg: 'rgba(212, 187, 255, 0.25)',
  wishlistActiveBorder: 'rgba(212, 187, 255, 0.5)',
  wishlistIcon: '#D4BBFF',
  detailsBg: 'rgba(255, 179, 198, 0.15)',
  gradientOverlay: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.98)'],
  fontFamily: 'Agdasima',
  profileIconColor: '#FFB3C6',
  subtitleText: 'Explore anime, find your next obsession',
  comingSoonTitle: 'Coming Soon',
  comingSoonSubtitle: 'Anime that are yet to release',
  comingSoonIcon: 'time-outline',
  newsTitle: 'Latest News',
  newsSubtitle: 'Fresh from Anime Corner',
  newsIcon: 'newspaper-outline',
};


// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                                                               ┃
// ┃     ██████╗  █████╗ ███╗   ███╗███████╗███████╗               ┃
// ┃    ██╔════╝ ██╔══██╗████╗ ████║██╔════╝██╔════╝               ┃
// ┃    ██║  ███╗███████║██╔████╔██║█████╗  ███████╗               ┃
// ┃    ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ╚════██║               ┃
// ┃    ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗███████║               ┃
// ┃     ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝               ┃
// ┃                                                               ┃
// ┃    Theme: Retro-Futurism Neon  🎮                             ┃
// ┃    Palette: #A78BFA · #7C3AED · #F43F5E                      ┃
// ┃    Font: System                                               ┃
// ┃                                                               ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const gamesTheme = {
  accent: '#A78BFA',
  accentLight: 'rgba(124, 58, 237, 0.15)',
  accentBorder: 'rgba(124, 58, 237, 0.4)',
  background: '#0F0F23',
  cardBg: '#1E1E3F',
  cardImageBg: '#1E1E3F',
  cardBorder: 'rgba(124, 58, 237, 0.2)',
  wishlistBg: 'rgba(124, 58, 237, 0.15)',
  wishlistBorder: 'rgba(124, 58, 237, 0.3)',
  wishlistActiveBg: 'rgba(124, 58, 237, 0.3)',
  wishlistActiveBorder: 'rgba(167, 139, 250, 0.6)',
  wishlistIcon: '#A78BFA',
  detailsBg: 'rgba(124, 58, 237, 0.2)',
  gradientOverlay: ['rgba(15,15,35,0.2)', 'rgba(15,15,35,0.8)', 'rgba(15,15,35,0.98)'],
  fontFamily: 'System',
  profileIconColor: '#A78BFA',
  subtitleText: 'Upcoming releases, news & more',
  comingSoonTitle: 'Upcoming Games',
  comingSoonSubtitle: 'Games that are yet to release',
  comingSoonIcon: 'game-controller-outline',
  newsTitle: 'Gaming News',
  newsSubtitle: 'Fresh from Insider Gaming',
  newsIcon: 'newspaper-outline',
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
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      ...baseStyles.container,
      backgroundColor: theme.background,
    },
    profileIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.accent,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '800',
      fontFamily: theme.fontFamily,
      color: '#fff',
      letterSpacing: 1,
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#888',
      fontFamily: theme.fontFamily,
      letterSpacing: 0.5,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700',
      fontFamily: theme.fontFamily,
      color: '#fff',
      letterSpacing: 0.5,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.accentLight,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: theme.fontFamily,
      color: theme.accent,
      letterSpacing: 0.3,
    },
    sectionSubtitle: {
      fontSize: 13,
      fontFamily: theme.fontFamily,
      color: '#666',
      letterSpacing: 0.3,
      marginTop: 4,
      marginLeft: 28,
    },
    card: {
      ...baseStyles.card,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    cardImage: {
      ...baseStyles.cardImage,
      backgroundColor: theme.cardImageBg,
    },
    expandedTitle: {
      fontSize: 16,
      fontWeight: '700',
      fontFamily: theme.fontFamily,
      color: '#fff',
      letterSpacing: 0.3,
      lineHeight: 20,
    },
    infoText: {
      fontSize: 12,
      fontFamily: theme.fontFamily,
      color: '#ccc',
      letterSpacing: 0.2,
      flex: 1,
    },
    expandedDescription: {
      fontSize: 11,
      fontFamily: theme.fontFamily,
      color: '#999',
      letterSpacing: 0.2,
      lineHeight: 15,
      marginTop: 4,
    },
    wishlistButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      backgroundColor: theme.wishlistBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.wishlistBorder,
    },
    wishlistButtonActive: {
      backgroundColor: theme.wishlistActiveBg,
      borderColor: theme.wishlistActiveBorder,
    },
    viewDetailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.detailsBg,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      flex: 1,
    },
    viewDetailsText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: theme.fontFamily,
      color: theme.accent,
      letterSpacing: 0.3,
    },
    loadingText: {
      color: '#666',
      fontSize: 14,
      fontFamily: theme.fontFamily,
      letterSpacing: 0.3,
    },
    // News Card Themed Styles
    newsCard: {
      ...baseStyles.newsCard,
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
    },
    newsImage: {
      ...baseStyles.newsImage,
      backgroundColor: theme.cardImageBg,
    },
    newsImagePlaceholder: {
      ...baseStyles.newsImagePlaceholder,
      backgroundColor: theme.cardBg,
    },
    newsCategoryBadge: {
      ...baseStyles.newsCategoryBadge,
      backgroundColor: theme.accentLight,
    },
    newsCategoryText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: theme.fontFamily,
      color: theme.accent,
      letterSpacing: 0.3,
    },
    newsTimeAgo: {
      fontSize: 11,
      fontFamily: theme.fontFamily,
      color: '#666',
    },
    newsTitle: {
      fontSize: 17,
      fontWeight: '700',
      fontFamily: theme.fontFamily,
      color: '#fff',
      letterSpacing: 0.3,
      lineHeight: 22,
      marginBottom: 10,
    },
    newsAuthor: {
      fontSize: 12,
      fontFamily: theme.fontFamily,
      color: '#888',
      flex: 1,
    },
  });


// ╔═══════════════════════════════════════════════════════════════╗
// ║                   CACHE & PUBLIC API                           ║
// ╚═══════════════════════════════════════════════════════════════╝

const styleCache = {};

/**
 * Get the themed StyleSheet for the Discover page.
 * @param {'anime' | 'games'} mediaType
 * @returns {StyleSheet}
 */
export const getDiscoverStyles = (mediaType = 'anime') => {
  const key = THEME_MAP[mediaType] ? mediaType : 'anime';
  if (!styleCache[key]) {
    styleCache[key] = buildStyles(THEME_MAP[key]);
  }
  return styleCache[key];
};

/**
 * Get the raw theme tokens (colors, fonts, content labels).
 * @param {'anime' | 'games'} mediaType
 * @returns {object}
 */
export const getDiscoverTheme = (mediaType = 'anime') => {
  return THEME_MAP[mediaType] || THEME_MAP.anime;
};

export { CARD_WIDTH, CARD_HEIGHT, EXPANDED_CARD_WIDTH };
