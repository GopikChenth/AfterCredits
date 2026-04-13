import { StyleSheet } from 'react-native';

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              REVIEW PAGE — STYLE HANDLER                      ║
 * ║                                                               ║
 * ║  Centralises all visual theming for the Review page.          ║
 * ║  Each media vertical gets its own palette while sharing       ║
 * ║  the same structural layout.                                  ║
 * ║                                                               ║
 * ║  Usage:                                                       ║
 * ║    import { getReviewPageStyles, getReviewPageTheme }         ║
 * ║      from '../stylehandler/reviewPageStyles';                 ║
 * ║    const styles = getReviewPageStyles('anime');               ║
 * ║    const theme  = getReviewPageTheme('anime');                ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */


// ╔═══════════════════════════════════════════════════════════════╗
// ║                    SHARED / BASE STYLES                       ║
// ╚═══════════════════════════════════════════════════════════════╝

const baseStyles = {
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  thumbnail: {
    width: 40,
    height: 60,
    borderRadius: 6,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  mediaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#595959',
    marginHorizontal: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  dateValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateValue: {
    fontSize: 16,
    color: '#333',
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  likeContainer: {
    alignItems: 'center',
  },
  smallLabel: {
    fontSize: 12,
    color: '#999',
  },
  reviewInput: {
    flex: 1,
    minHeight: 150,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  tagsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tagsPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  togglesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  toggleItem: {
    alignItems: 'center',
    width: 120,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      ANIME THEME  💜                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const animeTheme = {
  accent: '#A78BFA',
  background: '#0D0D0D',
  headingFont: 'Agdasima',
  contentFont: 'Agdasima',
  headerText: 'I Watched',
  mediaTypeKey: 'anime',
  ratingLabel: 'Please rate the anime before submitting.',
  inactiveStar: '#E0E0E0',
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      GAMES THEME  🎮                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const gamesTheme = {
  accent: '#0FA3B1',
  background: '#070B0F',
  headingFont: 'Agdasima-Bold',
  contentFont: 'Agdasima-Bold',
  headerText: 'I Played',
  mediaTypeKey: 'games',
  ratingLabel: 'Please rate the game before submitting.',
  inactiveStar: '#122A34',
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                     MOVIES THEME  🎬                          ║
// ║    Theme: Sunset — warm amber, burnt orange, deep charcoal    ║
// ╚═══════════════════════════════════════════════════════════════╝

const moviesTheme = {
  accent: '#FF6B35',
  background: '#0E0A07',
  headingFont: 'Agdasima-Bold',
  contentFont: 'Agdasima-Bold',
  headerText: 'I Watched',
  mediaTypeKey: 'movies',
  ratingLabel: 'Please rate the movie before submitting.',
  inactiveStar: '#3A2A1A',
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

    container: {
      ...baseStyles.container,
      backgroundColor: theme.background,
    },
    headerTitle: {
      ...baseStyles.headerTitle,
      fontFamily: theme.headingFont,
      fontWeight: theme.headingFont === 'Agdasima-Bold' ? 'normal' : baseStyles.headerTitle.fontWeight,
    },
    mediaTitle: {
      ...baseStyles.mediaTitle,
      fontFamily: theme.headingFont,
      fontWeight: theme.headingFont === 'Agdasima-Bold' ? 'normal' : baseStyles.mediaTitle.fontWeight,
    },
    smallLabel: {
      ...baseStyles.smallLabel,
      fontFamily: theme.contentFont,
    },
    reviewInput: {
      ...baseStyles.reviewInput,
      fontFamily: theme.contentFont,
      backgroundColor: theme.background,
    },
    tagsPlaceholder: {
      ...baseStyles.tagsPlaceholder,
      fontFamily: theme.contentFont,
    },
    toggleText: {
      ...baseStyles.toggleText,
      fontFamily: theme.contentFont,
    },
  });


// ╔═══════════════════════════════════════════════════════════════╗
// ║                   CACHE & PUBLIC API                           ║
// ╚═══════════════════════════════════════════════════════════════╝

const styleCache = {};

/**
 * @param {'anime' | 'games' | 'movies'} mediaType
 * @returns {StyleSheet}
 */
export const getReviewPageStyles = (mediaType = 'anime') => {
  const key = THEME_MAP[mediaType] ? mediaType : 'anime';
  if (!styleCache[key]) {
    styleCache[key] = buildStyles(THEME_MAP[key]);
  }
  return styleCache[key];
};

/**
 * @param {'anime' | 'games' | 'movies'} mediaType
 * @returns {object}
 */
export const getReviewPageTheme = (mediaType = 'anime') => {
  return THEME_MAP[mediaType] || THEME_MAP.anime;
};
