import { StyleSheet } from "react-native";

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
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "Genjiro",
    color: "#fff",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#888",
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
  },
};

// ╔═══════════════════════════════════════════════════════════════╗
// ║                      ANIME THEME  💜                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const animeTheme = {
  accent: "#A78BFA",
  background: "#0D0D0D",
  profileIconColor: "#A78BFA",
  fontFamily: "Agdasima",
  headerTitle: "Post",
  headerSubtitle: "Curated anime lists from the community",
  detailRoute: "PostDetailAnime",
};

// ╔═══════════════════════════════════════════════════════════════╗
// ║                      GAMES THEME  🎮                          ║
// ╚═══════════════════════════════════════════════════════════════╝

const gamesTheme = {
  accent: "#0FA3B1",
  background: "#070B0F",
  profileIconColor: "#0FA3B1",
  fontFamily: "System",
  titleFont: "Blackbots",
  headerTitle: "Post",
  headerSubtitle: "Game of the Year winners by year",
  detailRoute: "PostDetailAnime", // Shared detail page
};

// ╔═══════════════════════════════════════════════════════════════╗
// ║                     MOVIES THEME  🎬                          ║
// ║    Palette: #FF6B35 · #FFB347 · #FF4500                       ║
// ║    Theme: Sunset — warm amber, burnt orange, deep charcoal    ║
// ╚═══════════════════════════════════════════════════════════════╝

const moviesTheme = {
  accent: "#FF6B35", // Sunset orange
  background: "#0E0A07", // Deep warm charcoal
  profileIconColor: "#FFB347", // Amber glow
  fontFamily: "System",
  headerTitle: "Post",
  headerSubtitle: "Curated film lists from the community",
  detailRoute: "PostDetailAnime", // TODO: replace with PostDetailMovies
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
      fontFamily: theme.titleFont || "Genjiro",
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

export const getPostPageStyles = (mediaType = "anime") => {
  const key = THEME_MAP[mediaType] ? mediaType : "anime";
  return buildStyles(THEME_MAP[key]);
};

/**
 * @param {'anime' | 'games' | 'movies'} mediaType
 * @returns {object}
 */
export const getPostPageTheme = (mediaType = "anime") => {
  return THEME_MAP[mediaType] || THEME_MAP.anime;
};
