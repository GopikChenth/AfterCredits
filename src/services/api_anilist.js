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

const SEASON_CHAIN_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const SEASON_CHAIN_CACHE_MAX_ENTRIES = 80;
const seasonChainCache = new Map();
const animeToSeasonCacheKey = new Map();

const cloneSeasonChain = (seasons) =>
  seasons.map((season) => ({ ...season }));

const isSeasonCacheEntryExpired = (entry) =>
  !entry || Date.now() - entry.cachedAt > SEASON_CHAIN_CACHE_TTL_MS;

const clearSeasonCacheEntry = (cacheKey) => {
  const entry = seasonChainCache.get(cacheKey);
  if (!entry) return;

  seasonChainCache.delete(cacheKey);
  entry.ids.forEach((id) => {
    if (animeToSeasonCacheKey.get(id) === cacheKey) {
      animeToSeasonCacheKey.delete(id);
    }
  });
};

const touchSeasonCacheEntry = (cacheKey, entry) => {
  seasonChainCache.delete(cacheKey);
  seasonChainCache.set(cacheKey, entry);
};

const readSeasonChainFromCache = (animeId) => {
  const cacheKey = animeToSeasonCacheKey.get(animeId);
  if (!cacheKey) return null;

  const entry = seasonChainCache.get(cacheKey);
  if (isSeasonCacheEntryExpired(entry)) {
    clearSeasonCacheEntry(cacheKey);
    return null;
  }

  touchSeasonCacheEntry(cacheKey, entry);
  return cloneSeasonChain(entry.seasons);
};

const pruneSeasonChainCache = () => {
  while (seasonChainCache.size > SEASON_CHAIN_CACHE_MAX_ENTRIES) {
    const oldestKey = seasonChainCache.keys().next().value;
    if (!oldestKey) break;
    clearSeasonCacheEntry(oldestKey);
  }
};

const writeSeasonChainToCache = (seasons) => {
  if (!Array.isArray(seasons) || seasons.length === 0) return;

  const ids = seasons.map((season) => season.id).filter(Boolean);
  if (ids.length === 0) return;

  const cacheKey = ids.slice().sort((a, b) => a - b).join("-");
  const entry = {
    ids,
    seasons: cloneSeasonChain(seasons),
    cachedAt: Date.now(),
  };

  touchSeasonCacheEntry(cacheKey, entry);
  ids.forEach((id) => animeToSeasonCacheKey.set(id, cacheKey));
  pruneSeasonChainCache();
};

export const getAnimeSeasonChainCacheStats = () => ({
  entryCount: seasonChainCache.size,
  mappedAnimeIds: animeToSeasonCacheKey.size,
  ttlMs: SEASON_CHAIN_CACHE_TTL_MS,
  maxEntries: SEASON_CHAIN_CACHE_MAX_ENTRIES,
});

export const clearAnimeSeasonChainCache = () => {
  seasonChainCache.clear();
  animeToSeasonCacheKey.clear();
};

const SEASON_ORDER = {
  WINTER: 1,
  SPRING: 2,
  SUMMER: 3,
  FALL: 4,
};

const compareMediaOrder = (a, b) => {
  const aYear = Number(a.seasonYear) || Number.MAX_SAFE_INTEGER;
  const bYear = Number(b.seasonYear) || Number.MAX_SAFE_INTEGER;
  if (aYear !== bYear) return aYear - bYear;

  const aSeasonRank = SEASON_ORDER[a.season] || Number.MAX_SAFE_INTEGER;
  const bSeasonRank = SEASON_ORDER[b.season] || Number.MAX_SAFE_INTEGER;
  if (aSeasonRank !== bSeasonRank) return aSeasonRank - bSeasonRank;

  const aMonth = Number(a.startMonth) || Number.MAX_SAFE_INTEGER;
  const bMonth = Number(b.startMonth) || Number.MAX_SAFE_INTEGER;
  if (aMonth !== bMonth) return aMonth - bMonth;

  const aDay = Number(a.startDay) || Number.MAX_SAFE_INTEGER;
  const bDay = Number(b.startDay) || Number.MAX_SAFE_INTEGER;
  if (aDay !== bDay) return aDay - bDay;

  const aSeasonNum = extractSeasonNumber(a.title);
  const bSeasonNum = extractSeasonNumber(b.title);
  if (aSeasonNum != null && bSeasonNum != null) return aSeasonNum - bSeasonNum;
  if (aSeasonNum == null && bSeasonNum != null) return bSeasonNum > 1 ? -1 : 1;
  if (aSeasonNum != null && bSeasonNum == null) return aSeasonNum > 1 ? 1 : -1;

  return a.id - b.id;
};

const addRelationLink = (relationLinks, fromId, toId) => {
  if (!fromId || !toId || fromId === toId) return;
  if (!relationLinks.has(fromId)) relationLinks.set(fromId, new Set());
  relationLinks.get(fromId).add(toId);
};

const orderSeasonChain = (byId, relationLinks) => {
  const ids = Array.from(byId.keys());
  if (ids.length <= 1) return ids.map((id) => byId.get(id));

  const inDegree = new Map(ids.map((id) => [id, 0]));
  const outgoing = new Map(ids.map((id) => [id, new Set()]));

  relationLinks.forEach((targets, fromId) => {
    if (!byId.has(fromId)) return;

    targets.forEach((toId) => {
      if (!byId.has(toId) || fromId === toId) return;

      const fromTargets = outgoing.get(fromId);
      if (!fromTargets.has(toId)) {
        fromTargets.add(toId);
        inDegree.set(toId, (inDegree.get(toId) || 0) + 1);
      }
    });
  });

  const sortIds = (list) => list.sort((a, b) => compareMediaOrder(byId.get(a), byId.get(b)));

  const queue = sortIds(ids.filter((id) => inDegree.get(id) === 0));
  const orderedIds = [];
  const orderedSet = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    orderedIds.push(current);
    orderedSet.add(current);

    outgoing.get(current).forEach((nextId) => {
      inDegree.set(nextId, inDegree.get(nextId) - 1);
      if (inDegree.get(nextId) === 0) {
        queue.push(nextId);
        sortIds(queue);
      }
    });
  }

  if (orderedIds.length < ids.length) {
    const remaining = sortIds(ids.filter((id) => !orderedSet.has(id)));
    orderedIds.push(...remaining);
  }

  return orderedIds.map((id) => byId.get(id));
};

/**
 * Traverse prequel/sequel graph to collect full season chain
 * @param {number} startId - AniList anime ID
 * @param {number} maxNodes - Safety cap for traversal size
 * @returns {Promise<Array>} - Ordered season list including current anime
 */
export const getAnimeSeasonChain = async (startId, maxNodes = 12) => {
  if (!startId) return [];

  const cachedSeasonChain = readSeasonChainFromCache(startId);
  if (cachedSeasonChain) {
    return cachedSeasonChain;
  }

  const visited = new Set();
  const queue = [startId];
  const byId = new Map();
  const relationLinks = new Map();

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
      season: media.season || null,
      seasonYear: media.seasonYear || media.startDate?.year || 0,
      startMonth: media.startDate?.month || 0,
      startDay: media.startDate?.day || 0,
    });

    const edges = Array.isArray(media.relations?.edges) ? media.relations.edges : [];
    const linkedEdges = edges
      .filter((edge) => edge?.relationType && ["PREQUEL", "PARENT", "SEQUEL", "CHILD"].includes(edge.relationType))
      .filter((edge) => edge?.node?.id && edge?.node?.format === "TV");

    linkedEdges.forEach((edge) => {
      const linkedId = edge.node.id;
      if (!visited.has(linkedId)) queue.push(linkedId);

      if (edge.relationType === "SEQUEL" || edge.relationType === "CHILD") {
        addRelationLink(relationLinks, media.id, linkedId);
      }
      if (edge.relationType === "PREQUEL" || edge.relationType === "PARENT") {
        addRelationLink(relationLinks, linkedId, media.id);
      }
    });
  }

  const orderedSeasons = orderSeasonChain(byId, relationLinks);
  writeSeasonChainToCache(orderedSeasons);

  return orderedSeasons;
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
