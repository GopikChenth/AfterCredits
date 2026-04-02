/**
 * AniList API Service
 * All anime-related API requests, responses, and utilities
 * 
 * AniList API Documentation: https://anilist.gitbook.io/anilist-apiv2-docs/
 * GraphQL Endpoint: https://graphql.anilist.co
 */

import axios from 'axios';
import { runRequestWithPolicy } from './requestPolicy';

// ===========================================
// BASE CONFIGURATION
// ===========================================

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Default headers for AniList API
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ===========================================
// GRAPHQL QUERY HELPER
// ===========================================

/**
 * Execute a GraphQL query against AniList API
 * @param {string} query - GraphQL query string
 * @param {object} variables - Query variables
 * @returns {Promise<object>} - API response data
 */
const executeQuery = async (query, variables = {}) => {
  const requestKey = `anilist:${query}:${JSON.stringify(variables)}`;

  try {
    return await runRequestWithPolicy({
      dedupeKey: requestKey,
      requestFn: async () => {
        const response = await axios.post(
          ANILIST_API_URL,
          { query, variables },
          { headers: defaultHeaders }
        );
        return response.data;
      },
    });
  } catch (error) {
    console.error('AniList API Error:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// GRAPHQL FRAGMENTS (Reusable query parts)
// ===========================================

const MEDIA_FRAGMENT = `
  fragment MediaFields on Media {
    id
    title {
      romaji
      english
      native
    }
    coverImage {
      extraLarge
      large
      medium
      color
    }
    bannerImage
    description(asHtml: false)
    episodes
    duration
    status
    season
    seasonYear
    format
    genres
    averageScore
    popularity
    trending
    favourites
    studios(isMain: true) {
      nodes {
        id
        name
      }
    }
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    tags {
      name
      category
      rank
    }
  }
`;

const MEDIA_DETAIL_FRAGMENT = `
  fragment MediaDetailFields on Media {
    ...MediaFields
    synonyms
    source
    hashtag
    trailer {
      id
      site
      thumbnail
    }
    nextAiringEpisode {
      airingAt
      episode
      timeUntilAiring
    }
    characters(sort: ROLE, perPage: 10) {
      edges {
        role
        node {
          id
          name {
            full
          }
          image {
            medium
          }
        }
        voiceActors(language: JAPANESE) {
          id
          name {
            full
          }
          image {
            medium
          }
        }
      }
    }
    staff(perPage: 10) {
      edges {
        role
        node {
          id
          name {
            full
          }
          image {
            medium
          }
        }
      }
    }
    recommendations(perPage: 10) {
      nodes {
        mediaRecommendation {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          genres
        }
      }
    }
    reviews(perPage: 5, sort: RATING_DESC) {
      nodes {
        id
        summary
        rating
        ratingAmount
        user {
          id
          name
          avatar {
            medium
          }
        }
      }
    }
    stats {
      scoreDistribution {
        score
        amount
      }
      statusDistribution {
        status
        amount
      }
    }
    relations {
      edges {
        relationType
        node {
          id
          title {
            romaji
            english
          }
          coverImage {
            medium
          }
          format
          status
        }
      }
    }
  }
  ${MEDIA_FRAGMENT}
`;

// ===========================================
// API FUNCTIONS
// ===========================================

/**
 * Get trending anime
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 20)
 * @returns {Promise<object>} - Trending anime list
 */
export const getTrendingAnime = async (page = 1, perPage = 20) => {
  const query = `
    query ($page: Int, $perPage: Int, $excludedGenres: [String]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, sort: TRENDING_DESC, genre_not_in: $excludedGenres) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const response = await executeQuery(query, { page, perPage, excludedGenres: ['Hentai'] });
  return response.data.Page;
};

/**
 * Get popular anime
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 20)
 * @returns {Promise<object>} - Popular anime list
 */
export const getPopularAnime = async (page = 1, perPage = 20) => {
  const query = `
    query ($page: Int, $perPage: Int, $excludedGenres: [String]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, sort: POPULARITY_DESC, genre_not_in: $excludedGenres) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const response = await executeQuery(query, { page, perPage, excludedGenres: ['Hentai'] });
  return response.data.Page;
};

/**
 * Get new/recently added anime
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 20)
 * @returns {Promise<object>} - New anime list
 */
export const getNewAnime = async (page = 1, perPage = 20) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Determine current season
  let season;
  if (currentMonth >= 1 && currentMonth <= 3) season = 'WINTER';
  else if (currentMonth >= 4 && currentMonth <= 6) season = 'SPRING';
  else if (currentMonth >= 7 && currentMonth <= 9) season = 'SUMMER';
  else season = 'FALL';

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $excludedGenres: [String]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, season: $season, seasonYear: $seasonYear, status_in: [RELEASING, FINISHED], sort: START_DATE_DESC, genre_not_in: $excludedGenres) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const response = await executeQuery(query, { page, perPage, season, seasonYear: currentYear, excludedGenres: ['Hentai'] });
  return response.data.Page;
};

/**
 * Get anime details by ID
 * @param {number} id - AniList anime ID
 * @returns {Promise<object>} - Detailed anime information
 */
export const getAnimeDetails = async (id) => {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ...MediaDetailFields
      }
    }
    ${MEDIA_DETAIL_FRAGMENT}
  `;

  const response = await executeQuery(query, { id });
  return response.data.Media;
};

const extractSeasonNumber = (title) => {
  if (!title) return null;
  const match = title.match(/season\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

/**
 * Traverse prequel/sequel graph to collect full season chain
 * @param {number} startId - AniList anime ID
 * @param {number} maxNodes - Safety cap for traversal size
 * @returns {Promise<Array>} - Ordered season list including current anime
 */
export const getAnimeSeasonChain = async (startId, maxNodes = 12) => {
  if (!startId) return [];

  const visited = new Set();
  const queue = [startId];
  const byId = new Map();

  while (queue.length && byId.size < maxNodes) {
    const id = queue.shift();
    if (!id || visited.has(id)) continue;
    visited.add(id);

    let media;
    try {
      media = await getAnimeDetails(id);
    } catch (error) {
      continue;
    }

    if (!media || media.format !== "TV") continue;

    byId.set(media.id, {
      id: media.id,
      title: media.title?.english || media.title?.romaji || "Unknown",
      subtitle: media.title?.romaji || "",
      coverImage: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium,
      episodeCount: media.episodes || 0,
      seasonYear: media.seasonYear || media.startDate?.year || 0,
    });

    const edges = Array.isArray(media.relations?.edges) ? media.relations.edges : [];
    const linkedIds = edges
      .filter((edge) => edge?.relationType && ["PREQUEL", "PARENT", "SEQUEL", "CHILD"].includes(edge.relationType))
      .filter((edge) => edge?.node?.id && edge?.node?.format === "TV")
      .map((edge) => edge.node.id);

    linkedIds.forEach((linkedId) => {
      if (!visited.has(linkedId)) queue.push(linkedId);
    });
  }

  const seasons = Array.from(byId.values());
  seasons.sort((a, b) => {
    const aSeason = extractSeasonNumber(a.title);
    const bSeason = extractSeasonNumber(b.title);
    if (aSeason != null && bSeason != null) return aSeason - bSeason;
    if (aSeason != null) return -1;
    if (bSeason != null) return 1;
    if (a.seasonYear !== b.seasonYear) return a.seasonYear - b.seasonYear;
    return a.id - b.id;
  });

  return seasons;
};

/**
 * Search anime by title
 * @param {string} searchTerm - Search query
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 20)
 * @returns {Promise<object>} - Search results
 */
export const searchAnime = async (searchTerm, page = 1, perPage = 20) => {
  const query = `
    query ($search: String, $page: Int, $perPage: Int, $excludedGenres: [String]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, search: $search, sort: SEARCH_MATCH, genre_not_in: $excludedGenres) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const response = await executeQuery(query, { search: searchTerm, page, perPage, excludedGenres: ['Hentai'] });
  return response.data.Page;
};

/**
 * Get anime by genre
 * @param {string} genre - Genre name
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 20)
 * @returns {Promise<object>} - Anime list by genre
 */
export const getAnimeByGenre = async (genre, page = 1, perPage = 20) => {
  const query = `
    query ($genre: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const response = await executeQuery(query, { genre, page, perPage });
  return response.data.Page;
};

/**
 * Get anime recommendations based on an anime ID
 * @param {number} id - AniList anime ID
 * @param {number} perPage - Number of recommendations (default: 10)
 * @returns {Promise<object>} - Recommendations list
 */
export const getAnimeRecommendations = async (id, perPage = 10) => {
  const query = `
    query ($id: Int, $perPage: Int) {
      Media(id: $id, type: ANIME) {
        recommendations(perPage: $perPage, sort: RATING_DESC) {
          nodes {
            rating
            mediaRecommendation {
              ...MediaFields
            }
          }
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const response = await executeQuery(query, { id, perPage });
  return response.data.Media.recommendations.nodes;
};

/**
 * Get top rated anime
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 20)
 * @returns {Promise<object>} - Top rated anime list
 */
export const getTopRatedAnime = async (page = 1, perPage = 20) => {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, sort: SCORE_DESC) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const response = await executeQuery(query, { page, perPage });
  return response.data.Page;
};

/**
 * Get upcoming anime (not yet aired)
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 20)
 * @returns {Promise<object>} - Upcoming anime list
 */
export const getUpcomingAnime = async (page = 1, perPage = 20) => {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const response = await executeQuery(query, { page, perPage });
  return response.data.Page;
};

/**
 * Get anime reviews
 * @param {number} mediaId - AniList anime ID
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 10)
 * @returns {Promise<object>} - Reviews list
 */
export const getAnimeReviews = async (mediaId, page = 1, perPage = 10) => {
  const query = `
    query ($mediaId: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        reviews(mediaId: $mediaId, sort: RATING_DESC) {
          id
          summary
          body(asHtml: false)
          rating
          ratingAmount
          score
          createdAt
          user {
            id
            name
            avatar {
              medium
            }
          }
        }
      }
    }
  `;

  const response = await executeQuery(query, { mediaId, page, perPage });
  return response.data.Page;
};

/**
 * Get staff/voice actor details by ID
 * @param {number} id - AniList staff ID
 * @returns {Promise<object>} - Staff details with character media
 */
export const getStaffDetails = async (id) => {
  const query = `
    query ($id: Int) {
      Staff(id: $id) {
        id
        name {
          full
          native
        }
        image {
          large
          medium
        }
        description(asHtml: false)
        gender
        dateOfBirth {
          year
          month
          day
        }
        age
        yearsActive
        homeTown
        bloodType
        favourites
        characterMedia(sort: POPULARITY_DESC, perPage: 25) {
          edges {
            characterRole
            characterName
            node {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
                medium
              }
              format
              status
              seasonYear
            }
            characters {
              id
              name {
                full
              }
              image {
                medium
              }
            }
          }
        }
      }
    }
  `;

  const response = await executeQuery(query, { id });
  return response.data.Staff;
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Check if anime contains Hentai genre
 * @param {object} media - Raw AniList media object or formatted anime
 * @returns {boolean} - True if contains Hentai
 */
export const isHentai = (media) => {
  const genres = media.genres || [];
  return genres.includes('Hentai');
};

/**
 * Filter out Hentai anime from array
 * @param {array} animeList - Array of anime objects
 * @returns {array} - Filtered anime list
 */
export const filterHentai = (animeList) => {
  return animeList.filter(anime => !isHentai(anime));
};

/**
 * Format anime data for app consumption
 * @param {object} media - Raw AniList media object
 * @returns {object} - Formatted anime object
 */
export const formatAnimeData = (media) => {
  return {
    id: media.id,
    title: media.title.english || media.title.romaji,
    titleRomaji: media.title.romaji,
    titleNative: media.title.native,
    coverImage: media.coverImage.extraLarge || media.coverImage.large,
    bannerImage: media.bannerImage,
    description: media.description?.replace(/<[^>]*>/g, '') || '', // Strip HTML
    episodes: media.episodes,
    duration: media.duration,
    status: media.status,
    season: media.season,
    year: media.seasonYear,
    format: media.format,
    genres: media.genres,
    score: media.averageScore,
    popularity: media.popularity,
    trending: media.trending,
    studio: media.studios?.nodes?.[0]?.name || 'Unknown',
    color: media.coverImage.color,
    tags: media.tags || [],
    relations: media.relations || null,
  };
};

/**
 * Get status display text
 * @param {string} status - AniList status
 * @returns {string} - Human readable status
 */
export const getStatusText = (status) => {
  const statusMap = {
    FINISHED: 'Completed',
    RELEASING: 'Airing',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
    HIATUS: 'On Hiatus',
  };
  return statusMap[status] || status;
};

/**
 * Get format display text
 * @param {string} format - AniList format
 * @returns {string} - Human readable format
 */
export const getFormatText = (format) => {
  const formatMap = {
    TV: 'TV Series',
    TV_SHORT: 'TV Short',
    MOVIE: 'Movie',
    SPECIAL: 'Special',
    OVA: 'OVA',
    ONA: 'ONA',
    MUSIC: 'Music',
  };
  return formatMap[format] || format;
};

// ===========================================
// DEFAULT EXPORT
// ===========================================

export default {
  getTrendingAnime,
  getPopularAnime,
  getNewAnime,
  getAnimeDetails,
  getStaffDetails,
  searchAnime,
  getAnimeByGenre,
  getAnimeRecommendations,
  getTopRatedAnime,
  getUpcomingAnime,
  getAnimeReviews,
  formatAnimeData,
  getStatusText,
  getFormatText,
  isHentai,
  filterHentai,
};
