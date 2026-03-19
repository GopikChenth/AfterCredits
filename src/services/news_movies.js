/**
 * Movie News Service
 * Fetches movie/film news from major RSS sources with fallback.
 *
 * Source priority:
 *   1. Variety      — https://variety.com/feed/
 *   2. The Hollywood Reporter — https://hollywoodreporter.com/t/movies/feed/
 *   3. Collider     — https://collider.com/feed/
 */

import axios from 'axios';
import { parseRssItems } from './rssParser';
import { cacheGet, cacheSet } from './cacheManager';

// ── Cache config ──────────────────────────────────────────────────────────────
// Cache TTL: 30 minutes
const NEWS_CACHE_TTL = 30 * 60 * 1000;
const MOVIES_NEWS_CACHE_KEY = 'NEWS_CACHE:movies';

// ── RSS sources (tried in order until one succeeds) ──────────────────────────
const MOVIE_RSS_SOURCES = [
  {
    url: 'https://variety.com/feed/',
    defaultAuthor: 'Variety',
  },
  {
    url: 'https://www.hollywoodreporter.com/t/movies/feed/',
    defaultAuthor: 'The Hollywood Reporter',
  },
  {
    url: 'https://collider.com/feed/',
    defaultAuthor: 'Collider',
  },
];

// ── Shared HTTP config ────────────────────────────────────────────────────────
const HTTP_CONFIG = {
  headers: {
    Accept: 'application/rss+xml, application/xml, text/xml',
    'User-Agent': 'Mozilla/5.0 (compatible; AfterCredits/1.0)',
  },
  timeout: 10000,
};


// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch latest movie news, trying sources in priority order until one succeeds.
 *
 * @param {number} limit - Max articles to return (default 10)
 * @returns {Promise<Array>} Normalised article array
 */
export const getMovieNews = async (limit = 10) => {
  // Check cache first
  try {
    const cached = await cacheGet(MOVIES_NEWS_CACHE_KEY, { ttl: NEWS_CACHE_TTL });
    if (cached) {
      return cached.slice(0, limit);
    }
  } catch (_) {
    // Ignore cache read errors; fall through to network
  }

  let lastError = null;

  for (const source of MOVIE_RSS_SOURCES) {
    try {
      const response = await axios.get(source.url, HTTP_CONFIG);
      const articles = parseRssItems(response.data, { defaultAuthor: source.defaultAuthor });

      if (articles.length > 0) {
        const sorted = articles.sort((a, b) => b.publishedAt - a.publishedAt);

        // Persist to cache
        try {
          await cacheSet(MOVIES_NEWS_CACHE_KEY, sorted, {
            ttl: NEWS_CACHE_TTL,
            namespace: 'NEWS',
          });
        } catch (_) {
          // Non-fatal cache write failure
        }

        return sorted.slice(0, limit);
      }
    } catch (error) {
      console.warn(`[news_movies] Failed to fetch from ${source.url}:`, error.message);
      lastError = error;
    }
  }

  // All sources failed
  console.error('[news_movies] All sources failed. Last error:', lastError?.message);
  throw lastError || new Error('No movie news sources available');
};

export default { getMovieNews };
