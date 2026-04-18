/**
 * AniList API Service
 * All anime-related API requests, responses, and utilities
 * 
 * AniList API Documentation: https://anilist.gitbook.io/anilist-apiv2-docs/
 * GraphQL Endpoint: https://graphql.anilist.co
 */

import { runRequestWithPolicy } from './requestPolicy';
import { cacheGet, cacheSet, clearCacheByPrefixes } from './cacheManager';
import { supabase } from './supabase';

// ===========================================
// BASE CONFIGURATION
// ===========================================

const ANILIST_PROXY_FUNCTION = 'anilist-proxy';

const CACHE_DURATION = {
  ANILIST_DEFAULT: 6 * 60 * 60 * 1000,         // 6h
  ANILIST_TRENDING: 6 * 60 * 60 * 1000,        // 6h
  ANILIST_POPULAR: 6 * 60 * 60 * 1000,         // 6h
  ANILIST_NEW: 6 * 60 * 60 * 1000,             // 6h
  ANILIST_TOP: 6 * 60 * 60 * 1000,             // 6h
  ANILIST_UPCOMING: 6 * 60 * 60 * 1000,        // 6h
  ANILIST_GENRE: 6 * 60 * 60 * 1000,           // 6h
  ANILIST_DETAILS: 24 * 60 * 60 * 1000,        // 24h
  ANILIST_STAFF: 24 * 60 * 60 * 1000,          // 24h
  ANILIST_SEARCH: 1 * 60 * 60 * 1000,          // 1h
  ANILIST_REVIEWS: 1 * 60 * 60 * 1000,         // 1h
  ANILIST_RECOMMENDATIONS: 6 * 60 * 60 * 1000, // 6h
  ANILIST_SEASON_GRAPH: 12 * 60 * 60 * 1000,   // 12h
};

const getCacheTtlForKey = (cacheKey) => {
  const prefix = String(cacheKey || '').split(':')[0];
  return CACHE_DURATION[prefix] || CACHE_DURATION.ANILIST_DEFAULT;
};

const normalizeKeyPart = (value) =>
  encodeURIComponent(
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
  );

const stableStringify = (value) => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
};

const hashString = (input) => {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

// ===========================================
// GRAPHQL QUERY HELPER
// ===========================================

/**
 * Execute a GraphQL query against AniList API
 * @param {string} query - GraphQL query string
 * @param {object} variables - Query variables
 * @param {object} options
 * @param {string|null} options.cacheKey - Cache key override
 * @param {number|null} options.ttl - TTL override in ms
 * @returns {Promise<object>} - API response data
 */
const executeQuery = async (query, variables = {}, options = {}) => {
  const fingerprint = hashString(`${query}::${stableStringify(variables)}`);
  const cacheKey = options.cacheKey || `ANILIST_Q:${fingerprint}`;
  const ttl = typeof options.ttl === 'number' ? options.ttl : getCacheTtlForKey(cacheKey);

  try {
    const cached = await cacheGet(cacheKey, { ttl });
    if (cached) {
      return cached;
    }
  } catch (cacheError) {
    console.warn('AniList cache read error:', cacheError?.message || cacheError);
  }

  const requestKey = `anilist:${cacheKey}`;

  try {
    const data = await runRequestWithPolicy({
      dedupeKey: requestKey,
      requestFn: async () => {
        const { data, error } = await supabase.functions.invoke(ANILIST_PROXY_FUNCTION, {
          body: { query, variables },
        });

        if (error) {
          const err = new Error(error.message || 'AniList proxy request failed.');
          err.status = error.status || 500;
          throw err;
        }

        return data;
      },
    });

    try {
      await cacheSet(cacheKey, data, { ttl, namespace: 'ANILIST' });
    } catch (cacheError) {
      console.warn('AniList cache write error:', cacheError?.message || cacheError);
    }

    return data;
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

  const response = await executeQuery(
    query,
    { page, perPage, excludedGenres: ['Hentai'] },
    { cacheKey: `ANILIST_TRENDING:page${page}:size${perPage}` }
  );
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

  const response = await executeQuery(
    query,
    { page, perPage, excludedGenres: ['Hentai'] },
    { cacheKey: `ANILIST_POPULAR:page${page}:size${perPage}` }
  );
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

  const response = await executeQuery(
    query,
    { page, perPage, season, seasonYear: currentYear, excludedGenres: ['Hentai'] },
    { cacheKey: `ANILIST_NEW:${season}_${currentYear}:page${page}:size${perPage}` }
  );
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

  const response = await executeQuery(
    query,
    { id },
    { cacheKey: `ANILIST_DETAILS:${id}` }
  );
  return response.data.Media;
};

const extractSeasonNumber = (title) => {
  if (!title) return null;
  const match = title.match(/season\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

const SEASON_RELATION_TYPES = new Set(["PREQUEL", "PARENT", "SEQUEL", "CHILD"]);
const SEASON_GRAPH_DEPTH = 5;
const SEASON_CHAIN_EXPANSION_MAX_REQUESTS = 60;
const SEASON_CHAIN_CACHE_VERSION = "v3-single";

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
  if (!cacheKey.startsWith(`${SEASON_CHAIN_CACHE_VERSION}:`)) {
    animeToSeasonCacheKey.delete(animeId);
    return null;
  }

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

  const cacheKey = `${SEASON_CHAIN_CACHE_VERSION}:${ids
    .slice()
    .sort((a, b) => a - b)
    .join("-")}`;
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

export const clearAnimeApiCache = async () => {
  try {
    const removed = await clearCacheByPrefixes(['ANILIST_']);
    return removed;
  } catch (error) {
    console.warn('Failed to clear AniList API cache:', error?.message || error);
    return 0;
  }
};

const buildSeasonRelationNodeFields = (depth) => `
  id
  format
  title {
    romaji
    english
  }
  coverImage {
    extraLarge
    large
    medium
  }
  episodes
  season
  seasonYear
  startDate {
    year
    month
    day
  }
  ${
    depth > 0
      ? `
  relations {
    edges {
      relationType
      node {
        ${buildSeasonRelationNodeFields(depth - 1)}
      }
    }
  }
  `
      : ""
  }
`;

const fetchAnimeSeasonGraph = async (id, depth = SEASON_GRAPH_DEPTH) => {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${buildSeasonRelationNodeFields(depth)}
      }
    }
  `;

  const response = await executeQuery(
    query,
    { id },
    { cacheKey: `ANILIST_SEASON_GRAPH:id${id}:depth${depth}` }
  );
  return response.data.Media;
};

const mapSeasonMediaNode = (media) => ({
  id: media.id,
  title: media.title?.english || media.title?.romaji || "Unknown",
  subtitle: media.title?.romaji || "",
  coverImage:
    media.coverImage?.extraLarge ||
    media.coverImage?.large ||
    media.coverImage?.medium,
  episodeCount: media.episodes || 0,
  season: media.season || null,
  seasonYear: media.seasonYear || media.startDate?.year || 0,
  startMonth: media.startDate?.month || 0,
  startDay: media.startDate?.day || 0,
});

const collectSeasonGraphNodes = (
  media,
  depth,
  byId,
  relationLinks,
  seenDepthById
) => {
  if (!media?.id || depth < 0) return;

  const seenDepth = seenDepthById.get(media.id);
  if (seenDepth != null && seenDepth >= depth) return;
  seenDepthById.set(media.id, depth);

  if (media.format === "TV" && !byId.has(media.id)) {
    byId.set(media.id, mapSeasonMediaNode(media));
  }

  if (depth === 0) return;

  const edges = Array.isArray(media.relations?.edges) ? media.relations.edges : [];
  edges.forEach((edge) => {
    const relationType = edge?.relationType;
    const node = edge?.node;
    if (!SEASON_RELATION_TYPES.has(relationType) || !node?.id || node.format !== "TV") return;

    if (media.format === "TV") {
      if (relationType === "SEQUEL" || relationType === "CHILD") {
        addRelationLink(relationLinks, media.id, node.id);
      }
      if (relationType === "PREQUEL" || relationType === "PARENT") {
        addRelationLink(relationLinks, node.id, media.id);
      }
    }

    collectSeasonGraphNodes(node, depth - 1, byId, relationLinks, seenDepthById);
  });
};

const applySeasonChainLimit = (seasons, startId, maxNodes) => {
  if (!Number.isFinite(maxNodes) || maxNodes <= 0 || seasons.length <= maxNodes) {
    return seasons;
  }

  const currentIndex = seasons.findIndex((season) => season.id === startId);
  if (currentIndex === -1) return seasons.slice(0, maxNodes);

  const halfWindow = Math.floor(maxNodes / 2);
  let start = Math.max(0, currentIndex - halfWindow);
  let end = start + maxNodes;

  if (end > seasons.length) {
    end = seasons.length;
    start = Math.max(0, end - maxNodes);
  }

  return seasons.slice(start, end);
};

const mapSeasonRelationNode = (media) => ({
  id: media.id,
  title: media.title?.english || media.title?.romaji || "Unknown",
  subtitle: media.title?.romaji || "",
  coverImage:
    media.coverImage?.extraLarge ||
    media.coverImage?.large ||
    media.coverImage?.medium,
  episodeCount: media.episodes || 0,
  season: media.season || null,
  seasonYear: media.seasonYear || media.startDate?.year || 0,
  startMonth: media.startDate?.month || 0,
  startDay: media.startDate?.day || 0,
});

const expandSeasonGraphFromDetails = async (byId, relationLinks, maxNodes) => {
  const visited = new Set();
  const queue = Array.from(byId.keys());
  let requests = 0;

  while (
    queue.length > 0 &&
    byId.size < maxNodes &&
    requests < SEASON_CHAIN_EXPANSION_MAX_REQUESTS
  ) {
    const id = queue.shift();
    if (!id || visited.has(id)) continue;
    visited.add(id);

    let media;
    try {
      media = await getAnimeDetails(id);
      requests += 1;
    } catch (error) {
      continue;
    }

    if (!media || media.format !== "TV") continue;

    // Replace partial relation node snapshots with full media details.
    byId.set(media.id, mapSeasonMediaNode(media));

    const edges = Array.isArray(media.relations?.edges) ? media.relations.edges : [];
    edges.forEach((edge) => {
      if (!SEASON_RELATION_TYPES.has(edge?.relationType)) return;
      const node = edge?.node;
      if (!node?.id || node.format !== "TV") return;

      if (!byId.has(node.id)) {
        byId.set(node.id, mapSeasonRelationNode(node));
      }

      if (edge.relationType === "SEQUEL" || edge.relationType === "CHILD") {
        addRelationLink(relationLinks, media.id, node.id);
      }
      if (edge.relationType === "PREQUEL" || edge.relationType === "PARENT") {
        addRelationLink(relationLinks, node.id, media.id);
      }

      if (!visited.has(node.id) && queue.length < maxNodes * 3) {
        queue.push(node.id);
      }
    });
  }
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
 * Fetch only the current requested anime season node (no relation traversal)
 * @param {number} startId - AniList anime ID
 * @param {number} maxNodes - Kept for backward compatibility with callers
 * @returns {Promise<Array>} - Single-item list for the current anime season
 */
export const getAnimeSeasonChain = async (startId, maxNodes = 50) => {
  if (!startId) return [];

  const cachedSeasonChain = readSeasonChainFromCache(startId);
  if (cachedSeasonChain && cachedSeasonChain.length > 0) {
    return applySeasonChainLimit(cachedSeasonChain, startId, Math.max(1, maxNodes));
  }

  let currentSeasonMedia;
  try {
    // Fetch only the requested anime season node, without traversing relations.
    currentSeasonMedia = await fetchAnimeSeasonGraph(startId, 0);
  } catch (error) {
    return [];
  }

  if (!currentSeasonMedia || currentSeasonMedia.format !== "TV") return [];

  const currentSeason = mapSeasonMediaNode(currentSeasonMedia);
  const seasons = [currentSeason];
  writeSeasonChainToCache(seasons);

  return applySeasonChainLimit(seasons, startId, Math.max(1, maxNodes));
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

  const response = await executeQuery(
    query,
    { search: searchTerm, page, perPage, excludedGenres: ['Hentai'] },
    { cacheKey: `ANILIST_SEARCH:${normalizeKeyPart(searchTerm)}:page${page}:size${perPage}` }
  );
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

  const response = await executeQuery(
    query,
    { genre, page, perPage },
    { cacheKey: `ANILIST_GENRE:${normalizeKeyPart(genre)}:page${page}:size${perPage}` }
  );
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

  const response = await executeQuery(
    query,
    { id, perPage },
    { cacheKey: `ANILIST_RECOMMENDATIONS:${id}:size${perPage}` }
  );
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

  const response = await executeQuery(
    query,
    { page, perPage },
    { cacheKey: `ANILIST_TOP:page${page}:size${perPage}` }
  );
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

  const response = await executeQuery(
    query,
    { page, perPage },
    { cacheKey: `ANILIST_UPCOMING:page${page}:size${perPage}` }
  );
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

  const response = await executeQuery(
    query,
    { mediaId, page, perPage },
    { cacheKey: `ANILIST_REVIEWS:${mediaId}:page${page}:size${perPage}` }
  );
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

  const response = await executeQuery(
    query,
    { id },
    { cacheKey: `ANILIST_STAFF:${id}` }
  );
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
  if (!media || typeof media !== 'object') {
    return null;
  }

  const titleEnglish = media.title?.english || null;
  const titleRomaji = media.title?.romaji || null;
  const coverExtraLarge = media.coverImage?.extraLarge || null;
  const coverLarge = media.coverImage?.large || null;

  return {
    id: media.id,
    title: titleEnglish || titleRomaji || 'Unknown Title',
    titleRomaji: titleRomaji || '',
    titleNative: media.title?.native || '',
    coverImage: coverExtraLarge || coverLarge || null,
    bannerImage: media.bannerImage || null,
    description: media.description?.replace(/<[^>]*>/g, '') || '', // Strip HTML
    episodes: media.episodes ?? 0,
    duration: media.duration ?? null,
    status: media.status || null,
    season: media.season || null,
    year: media.seasonYear || null,
    format: media.format || null,
    genres: Array.isArray(media.genres) ? media.genres : [],
    score: media.averageScore ?? 0,
    popularity: media.popularity ?? 0,
    trending: media.trending ?? 0,
    studio: media.studios?.nodes?.[0]?.name || 'Unknown',
    color: media.coverImage?.color || null,
    tags: Array.isArray(media.tags) ? media.tags : [],
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
  clearAnimeApiCache,
};
