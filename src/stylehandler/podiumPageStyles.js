import { StyleSheet, Dimensions } from 'react-native';

// ─── Components ────────────────────────────────────────────
import DonutChart from '../components/podium_page/DonutChart';
import StatusCounters from '../components/podium_page/StatusCounters';
import TopList from '../components/podium_page/TopList';
import RadarGraph from '../components/podium_page/RadarGraph';
import SkeletonPodium from '../components/skeletons/SkeletonPodium';
import SkeletonPodiumList from '../components/skeletons/SkeletonPodiumList';

// ─── Services ──────────────────────────────────────────────
import { getAnimeDetails, formatAnimeData } from '../services/api_anilist';
import { getGameDetails, formatGameData } from '../services/api_rawg';
import { getMovieDetails, formatMovieData } from '../services/api_tmdb';

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║             PODIUM PAGE — STYLE + CONFIG HANDLER              ║
 * ║                                                               ║
 * ║  One single source of truth per media type:                   ║
 * ║    • styles       — StyleSheets for page & list               ║
 * ║    • theme        — colors, fonts, labels                     ║
 * ║    • components   — which React components to render          ║
 * ║    • services     — which API functions to call               ║
 * ║                                                               ║
 * ║  The page itself has ZERO if/else branching.                  ║
 * ║  It just reads:                                               ║
 * ║    const { Chart, Counters, ... } = theme.components;         ║
 * ║    const { fetchDetails, formatData } = theme.services;       ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      ANIME THEME  💜                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const animeTheme = {
  // ─── Visual tokens ───────────────────────────────────────
  accent: '#A78BFA',
  accentSecondary: '#818CF8',
  background: '#0D0D0D',
  cardBg: '#1A1A2E',
  cardPlaceholderBg: '#252540',
  profileIconColor: '#A78BFA',
  fontFamily: 'Agdasima',
  fontFamilyBold: 'Agdasima-Bold',

  // ─── Labels ──────────────────────────────────────────────
  headerTitle: 'Podium',
  headerSubtitle: 'Your anime stats',
  statusMediaType: 'anime',       // passed to getByStatus / getWishlist
  countLabel: 'anime',            // "5 anime"

  topGenresLabel: 'Top Genres',
  topSecondaryLabel: 'Top Studios',
  genreEmptyMessage: 'No genre data available yet',
  secondaryEmptyMessage: 'No studio data available yet',

  detailsRoute: 'DetailsAnime',

  // ─── Components ──────────────────────────────────────────
  components: {
    Chart: DonutChart,
    Counters: StatusCounters,
    GenreList: TopList,
    SecondaryList: TopList,
    Skeleton: SkeletonPodium,
    ListSkeleton: SkeletonPodiumList,
  },

  // ─── Service functions ───────────────────────────────────
  services: {
    fetchDetails: (mediaId) => getAnimeDetails(parseInt(mediaId)),
    formatData: (result) => formatAnimeData(result),
  },

  // ─── Data extraction ────────────────────────────────────
  extractGenres: (detail) => detail?.genres || [],
  extractSecondary: (detail) => detail?.studio ? [detail.studio] : [],
  extractTitle: (detail) => detail?.title || 'Loading...',
  extractCover: (detail) => detail?.coverImage,

  // ─── Empty state messages (list page) ───────────────────
  emptyMessages: {
    watching: 'Start watching anime and mark them here',
    watched: 'Mark anime as watched to track your history',
    dropped: "Anime you've dropped will appear here",
    wishlist: 'Add anime to your wishlist from the details page',
  },

  // ─── Status label overrides ──────────────────────────────
  statusLabels: {
    watching: 'Watching',
    watched: 'Completed',
    dropped: 'Dropped',
    wishlist: 'Wishlist',
  },
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                      GAMES THEME  🎮                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const gamesTheme = {
  // ─── Visual tokens ───────────────────────────────────────
  accent: '#4ADE80',
  accentSecondary: '#34D399',
  background: '#070F0A',
  cardBg: '#0F1F14',
  cardPlaceholderBg: '#1A3A2A',
  profileIconColor: '#4ADE80',
  fontFamily: 'System',
  fontFamilyBold: 'System',

  // ─── Labels ──────────────────────────────────────────────
  headerTitle: 'Podium',
  headerSubtitle: 'Your gaming stats',
  statusMediaType: 'games',
  countLabel: 'games',

  topGenresLabel: 'Top Genres',
  topSecondaryLabel: 'Top Developers',
  genreEmptyMessage: 'No genre data available yet',
  secondaryEmptyMessage: 'No developer data available yet',

  detailsRoute: 'DetailsGames',

  // ─── Components ──────────────────────────────────────────
  components: {
    Chart: DonutChart,
    Counters: StatusCounters,
    GenreList: TopList,
    SecondaryList: TopList,
    Skeleton: SkeletonPodium,
    ListSkeleton: SkeletonPodiumList,
  },

  // ─── Service functions ───────────────────────────────────
  services: {
    fetchDetails: (mediaId) => getGameDetails(parseInt(mediaId)),
    formatData: (result) => formatGameData(result),
  },

  // ─── Data extraction ────────────────────────────────────
  extractGenres: (detail) => detail?.genres || [],
  extractSecondary: (detail) => detail?.developers || [],
  extractTitle: (detail) => detail?.name || 'Loading...',
  extractCover: (detail) => detail?.coverImage,

  // ─── Empty state messages (list page) ───────────────────
  emptyMessages: {
    watching: 'Start playing games and mark them here',
    watched: 'Mark games as completed to track your history',
    dropped: "Games you've dropped will appear here",
    wishlist: 'Add games to your wishlist from the details page',
  },

  // ─── Status label overrides ──────────────────────────────
  statusLabels: {
    watching: 'Playing',
    watched: 'Completed',
    dropped: 'Dropped',
    wishlist: 'Wishlist',
  },
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║                     MOVIES THEME  🎬                          ║
// ║    Theme: Sunset — warm amber, burnt orange, deep charcoal    ║
// ╚═══════════════════════════════════════════════════════════════╝

const moviesTheme = {
  // ─── Visual tokens ───────────────────────────────────────
  accent: '#FF6B35',
  accentSecondary: '#FFB347',
  background: '#0E0A07',
  cardBg: '#1F1209',
  cardPlaceholderBg: '#3A2A1A',
  profileIconColor: '#FFB347',
  fontFamily: 'System',
  fontFamilyBold: 'System',

  // ─── Labels ──────────────────────────────────────────────
  headerTitle: 'Podium',
  headerSubtitle: 'Your movie stats',
  statusMediaType: 'movies',
  countLabel: 'movies',

  topGenresLabel: 'Top Genres',
  topSecondaryLabel: 'Top Production',
  genreEmptyMessage: 'No genre data available yet',
  secondaryEmptyMessage: 'No production data available yet',

  detailsRoute: 'DetailsMovies',

  // ─── Components ──────────────────────────────────────────
  components: {
    Chart: DonutChart,
    Counters: StatusCounters,
    GenreList: TopList,
    SecondaryList: TopList,
    Skeleton: SkeletonPodium,
    ListSkeleton: SkeletonPodiumList,
  },

  // ─── Service functions ───────────────────────────────────
  services: {
    fetchDetails: (mediaId) => getMovieDetails(mediaId),
    formatData: (result) => ({
      id: result.id,
      title: result.title || result.original_title || 'Untitled',
      coverImage: result.poster_path
        ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
        : null,
      genres: (result.genres || []).map(g => g.name),
      productionCompanies: (result.production_companies || []).map(c => c.name),
    }),
  },

  // ─── Data extraction ────────────────────────────────────
  extractGenres: (detail) => detail?.genres || [],
  extractSecondary: (detail) => detail?.productionCompanies || [],
  extractTitle: (detail) => detail?.title || 'Loading...',
  extractCover: (detail) => detail?.coverImage,

  // ─── Empty state messages (list page) ───────────────────
  emptyMessages: {
    watching: 'Start watching movies and mark them here',
    watched: 'Mark movies as watched to track your history',
    dropped: "Movies you've dropped will appear here",
    wishlist: 'Add movies to your wishlist from the details page',
  },

  // ─── Status label overrides ──────────────────────────────
  statusLabels: {
    watching: 'Watching',
    watched: 'Completed',
    dropped: 'Dropped',
    wishlist: 'Wishlist',
  },
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
// ║            PODIUM PAGE — STYLE BUILDER                        ║
// ╚═══════════════════════════════════════════════════════════════╝

const basePodiumStyles = {
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
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
    fontFamily: 'Genjiro',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  mainSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
};

const buildPodiumStyles = (theme) =>
  StyleSheet.create({
    ...basePodiumStyles,
    container: { ...basePodiumStyles.container, backgroundColor: theme.background },
    profileIcon: { ...basePodiumStyles.profileIcon, backgroundColor: theme.accent },
    headerTitle: { ...basePodiumStyles.headerTitle, fontFamily: 'Genjiro' },
    headerSubtitle: { ...basePodiumStyles.headerSubtitle, fontFamily: theme.fontFamily },
    loadingText: { ...basePodiumStyles.loadingText, fontFamily: theme.fontFamily },
    sectionTitle: { ...basePodiumStyles.sectionTitle, fontFamily: theme.fontFamily },
  });


// ╔═══════════════════════════════════════════════════════════════╗
// ║            PODIUM LIST PAGE — STYLE BUILDER                   ║
// ╚═══════════════════════════════════════════════════════════════╝

const basePodiumListStyles = {
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusHeaderBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
  },
  statusHeaderText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  countText: { flex: 1, textAlign: 'right', fontSize: 14, color: '#888' },
  mediaCard: {
    width: CARD_WIDTH, height: CARD_WIDTH * 1.5, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  cardPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  statusDot: {
    position: 'absolute', top: 8, right: 8, width: 10, height: 10,
    borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)', zIndex: 2,
  },
  titleOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingBottom: 10, paddingTop: 30,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
  },
  cardTitle: {
    fontSize: 13, fontWeight: '700', color: '#fff',
    letterSpacing: 0.3, lineHeight: 17,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
};

const buildPodiumListStyles = (theme) =>
  StyleSheet.create({
    ...basePodiumListStyles,
    container: { ...basePodiumListStyles.container, backgroundColor: theme.background },
    statusHeaderText: { ...basePodiumListStyles.statusHeaderText, fontFamily: theme.fontFamily },
    countText: { ...basePodiumListStyles.countText, fontFamily: theme.fontFamily },
    mediaCard: {
      ...basePodiumListStyles.mediaCard,
      backgroundColor: theme.cardBg || '#1A1A2E',
    },
    cardPlaceholder: {
      ...basePodiumListStyles.cardPlaceholder,
      backgroundColor: theme.cardPlaceholderBg || '#252540',
    },
    cardTitle: { ...basePodiumListStyles.cardTitle, fontFamily: theme.fontFamily },
    emptyTitle: { ...basePodiumListStyles.emptyTitle, fontFamily: theme.fontFamily },
    emptySubtitle: { ...basePodiumListStyles.emptySubtitle, fontFamily: theme.fontFamily },
  });


// ╔═══════════════════════════════════════════════════════════════╗
// ║                   CACHE & PUBLIC API                           ║
// ╚═══════════════════════════════════════════════════════════════╝

const podiumStyleCache = {};
const podiumListStyleCache = {};

export const getPodiumPageStyles = (mediaType = 'anime') => {
  const key = THEME_MAP[mediaType] ? mediaType : 'anime';
  if (!podiumStyleCache[key]) podiumStyleCache[key] = buildPodiumStyles(THEME_MAP[key]);
  return podiumStyleCache[key];
};

export const getPodiumListStyles = (mediaType = 'anime') => {
  const key = THEME_MAP[mediaType] ? mediaType : 'anime';
  if (!podiumListStyleCache[key]) podiumListStyleCache[key] = buildPodiumListStyles(THEME_MAP[key]);
  return podiumListStyleCache[key];
};

export const getPodiumPageTheme = (mediaType = 'anime') => {
  return THEME_MAP[mediaType] || THEME_MAP.anime;
};

export { CARD_WIDTH };
