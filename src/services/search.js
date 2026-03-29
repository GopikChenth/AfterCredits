/**
 * Unified Search API Service
 * Handles search across all media types: Anime, Movies, Games, Comics, Manga
 */

import { searchAnime, formatAnimeData } from './api_anilist';
import { searchMovies, formatMovieData } from './api_tmdb';
import { searchGamesIGDB } from './api_igdb';

const normalizeSearchText = (value) => (value || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const levenshteinDistance = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

const buildGameQueryVariants = (query) => {
  const raw = (query || '').trim();
  const normalized = normalizeSearchText(raw);
  const beforeColon = raw.split(':')[0].trim();
  const beforeDash = raw.split('-')[0].trim();
  const withoutParens = raw.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedNoEditions = normalizeSearchText(raw)
    .replace(/\b(game of the year|goty|definitive|director s cut|ultimate|complete|remastered|edition|bundle)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const firstTwoTokens = normalized.split(' ').slice(0, 2).join(' ').trim();

  const variants = [
    raw,
    beforeColon,
    beforeDash,
    withoutParens,
    normalized,
    normalizedNoEditions,
    firstTwoTokens,
  ]
    .map((v) => (v || '').trim())
    .filter((v) => v.length >= 2);

  return [...new Set(variants)];
};

const gameRelevanceScore = (game, query) => {
  const title = normalizeSearchText(game?.title);
  const q = normalizeSearchText(query);
  if (!title || !q) return -9999;

  let score = 0;
  if (title === q) score += 1200;
  if (title.startsWith(q)) score += 700;
  if (title.includes(` ${q}`)) score += 540;
  else if (title.includes(q)) score += 420;

  const qTokens = q.split(' ').filter((t) => t.length > 1);
  const titleTokens = title.split(' ').filter(Boolean);
  let matchedTokens = 0;

  for (const token of qTokens) {
    if (titleTokens.some((word) => word.startsWith(token))) {
      score += 95;
      matchedTokens += 1;
    } else if (title.includes(token)) {
      score += 45;
      matchedTokens += 0.5;
    } else {
      score -= 40;
    }
  }

  if (qTokens.length > 0) {
    score += (matchedTokens / qTokens.length) * 180;
  }

  const acronym = titleTokens.map((word) => word[0]).join('');
  const queryAcronym = q.replace(/\s+/g, '');
  if (queryAcronym.length > 1 && acronym.startsWith(queryAcronym)) {
    score += 130;
  }

  const windowSize = Math.max(q.length, 16);
  const distance = levenshteinDistance(q, title.slice(0, windowSize));
  score -= Math.min(140, distance * 7);

  // Keep popularity as a soft tie-breaker, not the primary ranking signal.
  score += Math.min(90, (game.popularity || 0) / 250);
  return score;
};

const rankGameResults = (results, query, limit) => {
  const ranked = [...results]
    .map((item) => ({
      ...item,
      _relevance: gameRelevanceScore(item, query),
    }))
    .sort((a, b) => {
      if (b._relevance !== a._relevance) return b._relevance - a._relevance;
      return (b.popularity || 0) - (a.popularity || 0);
    })
    .slice(0, limit)
    .map(({ _relevance, ...rest }) => rest);

  return ranked;
};

const searchGamesSmart = async (query, limit) => {
  const variants = buildGameQueryVariants(query).slice(0, 5);
  const fetchLimit = Math.min(80, Math.max(limit * 4, 24));
  const merged = new Map();

  for (let i = 0; i < variants.length; i += 1) {
    const variant = variants[i];
    const batch = await searchGamesIGDB(variant, fetchLimit);
    const batchCount = batch?.length || 0;
    for (const item of batch || []) {
      const key = String(item.id);
      if (!merged.has(key)) merged.set(key, item);
    }
    // Run at least two variants before early-stopping, so subtitle/edition
    // differences don't block relevant matches.
    if (i >= 1 && merged.size >= Math.max(limit * 4, 24)) break;
    if (i >= 1 && batchCount === 0 && merged.size >= Math.max(limit * 2, 12)) break;
  }

  return rankGameResults([...merged.values()], query, limit);
};

/**
 * Search across any media type
 * @param {string} query - Search query
 * @param {string} mediaType - 'anime' | 'movie' | 'game' | 'comic' | 'manga'
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>} Formatted search results
 */
export const searchMedia = async (query, mediaType = 'anime', limit = 20) => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    let response;
    let results = [];
    
    switch (mediaType) {
      case 'anime':
        response = await searchAnime(query, 1, limit);
        // AniList returns { media: [...] } structure
        results = response.media ? response.media.map(formatAnimeData) : [];
        break;
      
      case 'movie':
      case 'movies':
        response = await searchMovies(query, 1, limit);
        // Movies API returns { media: [...] } structure
        results = response.media ? response.media.map(formatMovieData) : [];
        break;
      
      case 'game':
      case 'games':
        results = await searchGamesSmart(query, limit);
        break;
      
      case 'comic':
        // TODO: Implement comic search API
        console.log('Comic search not yet implemented');
        return [];
      
      case 'manga':
        // TODO: Implement manga search API (can use Jikan/AniList)
        console.log('Manga search not yet implemented');
        return [];
      
      default:
        console.warn(`Unknown media type: ${mediaType}`);
        return [];
    }

    // Keep game results in relevance order; others by popularity.
    if (mediaType === 'game' || mediaType === 'games') {
      return results;
    }
    return results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    
  } catch (error) {
    console.error(`Error searching ${mediaType}:`, error);
    return []; // Return empty array on error instead of throwing
  }
};

/**
 * Debounce helper for search input
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 */
export const debounce = (func, delay = 500) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
