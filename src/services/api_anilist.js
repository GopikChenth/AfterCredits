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

const SEASON_CHAIN_BATCH_SIZE = 12;
const DISPLAY_SEASON_FORMATS = new Set(["TV", "TV_SHORT"]);
const ANIME_PLANET_BASE_URL = "https://www.anime-planet.com";
const ANIME_PLANET_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
};
const ANIME_PLANET_TIMEOUT_MS = 1800;
const ANIME_PLANET_LOOKUP_BUDGET_MS = 3200;
const ANIME_PLANET_MAX_URL_ATTEMPTS = 2;
const ANIME_PLANET_MAX_TITLE_HINTS = 16;
const ANIME_PLANET_TITLE_ID_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const ANIME_PLANET_PAGE_CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
const animePlanetPageCache = new Map();
const animePlanetTitleIdCache = new Map();
const ANIME_PLANET_SECTION_STOP_WORDS = new Set([
  "related manga",
  "characters",
  "staff",
  "reviews",
  "discussions",
  "custom lists",
  "if you like this anime, you might like...",
]);

const isAnimePlanetCacheExpired = (entry, ttlMs) =>
  !entry || Date.now() - entry.cachedAt > ttlMs;

const getAnimePlanetCacheValue = (cache, key, ttlMs) => {
  const entry = cache.get(key);
  if (isAnimePlanetCacheExpired(entry, ttlMs)) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setAnimePlanetCacheValue = (cache, key, value) => {
  cache.set(key, {
    value,
    cachedAt: Date.now(),
  });
};

const decodeHtmlEntities = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
};

const toComparableTitle = (title) =>
  (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const toAnimePlanetSlug = (title) =>
  (title || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeSeasonTitle = (value) =>
  value
    .replace(/\s+\d{4}-\d{2}-\d{2}[\s\S]*$/i, "")
    .replace(/\s+(sequel|prequel|same franchise|child|parent)\b[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const extractAnimePlanetRelatedSlugs = (html) => {
  if (!html || typeof html !== "string") return [];

  const sectionMatch = html.match(
    /related anime[\s\S]*?(related manga|characters|staff|reviews|discussions|custom lists)/i
  );
  const scopedHtml = sectionMatch?.[0] || html;

  const slugs = [];
  const seen = new Set();
  const slugRegex = /href=["']\/anime\/([^"'?#/]+)["']/gi;
  let match;
  while ((match = slugRegex.exec(scopedHtml)) !== null) {
    const slug = match[1]?.trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }
  return slugs;
};

const extractAnimePlanetRelatedTitles = (html) => {
  if (!html || typeof html !== "string") return [];

  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = decodeHtmlEntities(noScript.replace(/<[^>]*>/g, "\n"));

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const startIndex = lines.findIndex((line) => line.toLowerCase() === "related anime");
  if (startIndex === -1) return [];

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (ANIME_PLANET_SECTION_STOP_WORDS.has(lines[i].toLowerCase())) {
      endIndex = i;
      break;
    }
  }

  const titles = [];
  const seen = new Set();
  for (let i = startIndex + 1; i < endIndex; i += 1) {
    const raw = lines[i];
    if (!raw) continue;
    if (
      /^(same franchise|add to list|see all|anime|manga|\d+\s+votes?)$/i.test(raw)
    ) {
      continue;
    }

    const title = normalizeSeasonTitle(raw);
    if (!title || title.length < 2 || title.length > 120) continue;
    if (!/[a-z]/i.test(title)) continue;

    const key = toComparableTitle(title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    titles.push(title);
  }

  return titles;
};

const getAnimePlanetLookupInfo = async (animeId) => {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        title {
          english
          romaji
          native
        }
        externalLinks {
          site
          url
        }
      }
    }
  `;

  const response = await executeQuery(query, { id: animeId });
  const media = response?.data?.Media;
  if (!media) return null;

  const titles = [
    media.title?.english,
    media.title?.romaji,
    media.title?.native,
  ].filter(Boolean);
  const animePlanetLink = (media.externalLinks || []).find(
    (link) =>
      typeof link?.url === "string" &&
      link.url.includes("anime-planet.com/anime/")
  );

  return {
    url: animePlanetLink?.url || null,
    titles,
  };
};

const fetchAnimePlanetHtml = async (url) => {
  if (!url) return null;

  const cachedHtml = getAnimePlanetCacheValue(
    animePlanetPageCache,
    url,
    ANIME_PLANET_PAGE_CACHE_TTL_MS
  );
  if (typeof cachedHtml === "string" && cachedHtml.length > 0) {
    return cachedHtml;
  }

  const requestKey = `animeplanet:page:${url}`;
  try {
    const response = await runRequestWithPolicy({
      dedupeKey: requestKey,
      maxRetries: 0,
      requestFn: async () =>
        axios.get(url, {
          headers: ANIME_PLANET_HEADERS,
          timeout: ANIME_PLANET_TIMEOUT_MS,
        }),
    });

    const html = typeof response?.data === "string" ? response.data : null;
    if (html) {
      setAnimePlanetCacheValue(animePlanetPageCache, url, html);
    }
    return html;
  } catch (error) {
    return null;
  }
};

const searchAnimeCandidatesByTitle = async (searchTerm) => {
  const query = `
    query ($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
          id
          title {
            english
            romaji
            native
          }
          format
          genres
        }
      }
    }
  `;

  const response = await executeQuery(query, {
    search: searchTerm,
    perPage: 8,
  });
  return (
    response?.data?.Page?.media?.filter(
      (media) => !Array.isArray(media?.genres) || !media.genres.includes("Hentai")
    ) || []
  );
};

const scoreTitleMatch = (targetTitle, candidate) => {
  const target = toComparableTitle(targetTitle);
  if (!target) return 0;

  const candidateTitles = [
    candidate?.title?.english,
    candidate?.title?.romaji,
    candidate?.title?.native,
  ]
    .filter(Boolean)
    .map(toComparableTitle);

  let bestScore = 0;
  candidateTitles.forEach((candidateTitle) => {
    if (candidateTitle === target) {
      bestScore = Math.max(bestScore, 100);
      return;
    }
    if (candidateTitle.startsWith(target) || target.startsWith(candidateTitle)) {
      bestScore = Math.max(bestScore, 85);
      return;
    }
    if (candidateTitle.includes(target) || target.includes(candidateTitle)) {
      bestScore = Math.max(bestScore, 70);
      return;
    }
  });

  if (DISPLAY_SEASON_FORMATS.has(candidate?.format)) {
    bestScore += 10;
  }
  return bestScore;
};

const resolveSingleAnimeTitleToAniListId = async (title) => {
  const normalizedTitle = toComparableTitle(title);
  if (!normalizedTitle) return null;

  const cachedId = getAnimePlanetCacheValue(
    animePlanetTitleIdCache,
    normalizedTitle,
    ANIME_PLANET_TITLE_ID_CACHE_TTL_MS
  );
  if (cachedId !== null && cachedId !== undefined) {
    return cachedId > 0 ? cachedId : null;
  }

  try {
    const candidates = await searchAnimeCandidatesByTitle(title);
    if (!candidates.length) {
      setAnimePlanetCacheValue(animePlanetTitleIdCache, normalizedTitle, 0);
      return null;
    }

    const bestMatch = candidates
      .map((candidate) => ({
        candidate,
        score: scoreTitleMatch(title, candidate),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (!bestMatch?.candidate?.id || bestMatch.score < 60) {
      setAnimePlanetCacheValue(animePlanetTitleIdCache, normalizedTitle, 0);
      return null;
    }

    const resolvedId = Number(bestMatch.candidate.id);
    if (!Number.isFinite(resolvedId) || resolvedId <= 0) {
      setAnimePlanetCacheValue(animePlanetTitleIdCache, normalizedTitle, 0);
      return null;
    }

    setAnimePlanetCacheValue(animePlanetTitleIdCache, normalizedTitle, resolvedId);
    return resolvedId;
  } catch (error) {
    return null;
  }
};

const resolveAnimePlanetTitlesToAniListIds = async (titleHints = [], maxItems = 24) => {
  const dedupedHints = Array.from(
    new Set(
      titleHints
        .map((title) => title?.trim())
        .filter(Boolean)
    )
  ).slice(0, ANIME_PLANET_MAX_TITLE_HINTS);

  const resolved = await Promise.all(
    dedupedHints.map((title) => resolveSingleAnimeTitleToAniListId(title))
  );

  const resolvedIds = [];
  const seenIds = new Set();
  resolved.forEach((id) => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0 || seenIds.has(numericId)) return;
    seenIds.add(numericId);
    resolvedIds.push(numericId);
  });

  return resolvedIds.slice(0, maxItems);
};

const fetchAnimeSeasonMediaByIds = async (ids = []) => {
  const normalizedIds = Array.from(
    new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))
  );
  if (normalizedIds.length === 0) return [];

  const media = [];
  for (let index = 0; index < normalizedIds.length; index += SEASON_CHAIN_BATCH_SIZE) {
    const chunk = normalizedIds.slice(index, index + SEASON_CHAIN_BATCH_SIZE);
    try {
      const chunkMedia = await getAnimeSeasonGraphBatch(chunk);
      media.push(...chunkMedia);
    } catch (error) {
      // Keep partial results if any chunk fails.
    }
  }
  return media;
};

const mapMediaToSeasonEntry = (media) => ({
  id: media.id,
  title: media.title?.english || media.title?.romaji || "Unknown",
  subtitle: media.title?.romaji || "",
  coverImage: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium,
  episodeCount: media.episodes || 0,
  format: media.format || null,
  season: media.season || null,
  seasonYear: media.seasonYear || media.startDate?.year || 0,
  startMonth: media.startDate?.month || 0,
  startDay: media.startDate?.day || 0,
});

const getAnimePlanetSeasonChain = async (startId, maxNodes = 24) => {
  const startedAt = Date.now();
  let lookup;
  try {
    lookup = await getAnimePlanetLookupInfo(startId);
  } catch (error) {
    return [];
  }

  if (!lookup) return [];

  const urlCandidates = [];
  if (lookup.url) {
    urlCandidates.push(lookup.url);
  }
  lookup.titles.forEach((title) => {
    const slug = toAnimePlanetSlug(title);
    if (slug) {
      urlCandidates.push(`${ANIME_PLANET_BASE_URL}/anime/${slug}`);
    }
  });

  const uniqueUrls = Array.from(new Set(urlCandidates));
  const urlsToTry = uniqueUrls.slice(0, ANIME_PLANET_MAX_URL_ATTEMPTS);

  let html = null;
  for (let i = 0; i < urlsToTry.length; i += 1) {
    if (Date.now() - startedAt > ANIME_PLANET_LOOKUP_BUDGET_MS) {
      break;
    }
    html = await fetchAnimePlanetHtml(urlsToTry[i]);
    if (html) break;
  }
  if (!html) return [];

  const relatedTitles = extractAnimePlanetRelatedTitles(html);
  const relatedSlugs = extractAnimePlanetRelatedSlugs(html);
  const relatedSlugTitles = relatedSlugs.map((slug) =>
    slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );

  const titleHints = Array.from(
    new Set([
      ...lookup.titles,
      ...relatedTitles,
      ...relatedSlugTitles,
    ])
  ).slice(0, Math.max(ANIME_PLANET_MAX_TITLE_HINTS, maxNodes));

  const resolvedIds = await resolveAnimePlanetTitlesToAniListIds(titleHints, maxNodes + 8);
  if (!resolvedIds.length) return [];

  if (!resolvedIds.includes(startId)) {
    resolvedIds.unshift(startId);
  }

  const mediaEntries = await fetchAnimeSeasonMediaByIds(resolvedIds);
  if (!mediaEntries.length) return [];

  const ordered = mediaEntries
    .filter((entry) => DISPLAY_SEASON_FORMATS.has(entry?.format))
    .map(mapMediaToSeasonEntry)
    .sort(compareMediaOrder)
    .slice(0, maxNodes);

  return ordered;
};

const getAnimeSeasonGraphBatch = async (ids = []) => {
  const normalizedIds = Array.from(
    new Set(
      ids
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );
  if (normalizedIds.length === 0) return [];

  const query = `
    query ($ids: [Int], $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, id_in: $ids) {
          id
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
          format
          season
          seasonYear
          startDate {
            year
            month
            day
          }
          relations {
            edges {
              relationType
              node {
                id
                type
                format
              }
            }
          }
        }
      }
    }
  `;

  const response = await executeQuery(query, {
    ids: normalizedIds,
    perPage: normalizedIds.length,
  });

  return response?.data?.Page?.media || [];
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
export const getAnimeSeasonChain = async (startId, maxNodes = 24) => {
  const normalizedStartId = Number(startId);
  if (!Number.isFinite(normalizedStartId) || normalizedStartId <= 0) return [];

  const cachedSeasonChain = readSeasonChainFromCache(normalizedStartId);
  if (cachedSeasonChain) {
    return cachedSeasonChain;
  }

  // Use anime-planet as additional seed IDs (not a standalone result)
  let seedIds = [normalizedStartId];
  try {
    const animePlanetSeasons = await getAnimePlanetSeasonChain(normalizedStartId, maxNodes);
    if (animePlanetSeasons.length > 0) {
      const apIds = animePlanetSeasons.map((s) => s.id).filter(Boolean);
      seedIds = Array.from(new Set([normalizedStartId, ...apIds]));
    }
  } catch (_) {
    // Anime-planet lookup failed, proceed with just the start ID
  }

  // BFS through AniList PREQUEL/SEQUEL/PARENT/CHILD relations
  const visited = new Set();
  const queued = new Set(seedIds);
  const queue = [...seedIds];
  const byId = new Map();
  const relationLinks = new Map();

  while (queue.length && byId.size < maxNodes) {
    const batchIds = [];
    while (queue.length > 0 && batchIds.length < SEASON_CHAIN_BATCH_SIZE) {
      const id = queue.shift();
      queued.delete(id);
      if (!id || visited.has(id)) continue;
      visited.add(id);
      batchIds.push(id);
    }
    if (batchIds.length === 0) continue;

    let mediaBatch = [];
    try {
      mediaBatch = await getAnimeSeasonGraphBatch(batchIds);
    } catch (error) {
      continue;
    }

    const mediaById = new Map(
      mediaBatch
        .filter((media) => media?.id)
        .map((media) => [media.id, media])
    );

    batchIds.forEach((id) => {
      const media = mediaById.get(id);
      if (!media) return;

      if (!byId.has(media.id) && byId.size >= maxNodes) return;
      byId.set(media.id, mapMediaToSeasonEntry(media));

      const edges = Array.isArray(media.relations?.edges) ? media.relations.edges : [];
      const linkedEdges = edges
        .filter((edge) => edge?.relationType && ["PREQUEL", "PARENT", "SEQUEL", "CHILD"].includes(edge.relationType))
        .filter((edge) => edge?.node?.id && edge?.node?.type === "ANIME");

      linkedEdges.forEach((edge) => {
        const linkedId = Number(edge.node.id);
        if (!Number.isFinite(linkedId) || linkedId <= 0) return;
        if (!visited.has(linkedId) && !queued.has(linkedId)) {
          queue.push(linkedId);
          queued.add(linkedId);
        }

        if (edge.relationType === "SEQUEL" || edge.relationType === "CHILD") {
          addRelationLink(relationLinks, media.id, linkedId);
        }
        if (edge.relationType === "PREQUEL" || edge.relationType === "PARENT") {
          addRelationLink(relationLinks, linkedId, media.id);
        }
      });
    });
  }

  const orderedSeasons = orderSeasonChain(byId, relationLinks)
    .filter((entry) => DISPLAY_SEASON_FORMATS.has(entry.format));
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
