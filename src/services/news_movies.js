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


// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parse RSS XML into a normalised array of movie news articles.
 * Handles both CDATA-wrapped and plain text fields, and attempts
 * multiple image extraction strategies.
 *
 * @param {string} xmlText       - Raw RSS XML string
 * @param {string} defaultAuthor - Fallback author label for this source
 * @returns {Array}
 */
const parseMovieRSS = (xmlText, defaultAuthor = 'Film News') => {
  try {
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const item = match[1];

      // ── Title ──────────────────────────────────────────────────────────────
      const title =
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] ||
        '';

      // ── Link ───────────────────────────────────────────────────────────────
      const link =
        item.match(/<link>(.*?)<\/link>/)?.[1] ||
        item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ||
        '';

      // ── Author ─────────────────────────────────────────────────────────────
      const author =
        item.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/)?.[1] ||
        item.match(/<author>(.*?)<\/author>/)?.[1] ||
        defaultAuthor;

      // ── Pub date ───────────────────────────────────────────────────────────
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

      // ── Description (strip HTML tags & decode common entities) ────────────
      const rawDesc =
        item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
        item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
        '';
      const description = rawDesc
        .replace(/<[^>]*>/g, '')
        .replace(/&hellip;/g, '...')
        .replace(/&amp;/g, '&')
        .replace(/&#038;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .trim();

      // ── Categories ─────────────────────────────────────────────────────────
      const categoryRegex = /<category><!\[CDATA\[(.*?)\]\]><\/category>/g;
      const categories = [];
      let catMatch;
      while ((catMatch = categoryRegex.exec(item)) !== null) {
        categories.push(catMatch[1]);
      }

      // ── Image (multiple strategies) ────────────────────────────────────────
      let image = null;

      // 1. media:content url attribute
      if (!image) {
        const m = item.match(/<media:content[^>]+url=["']([^"'>]+)["']/);
        if (m) image = m[1];
      }

      // 2. media:thumbnail url attribute
      if (!image) {
        const m = item.match(/<media:thumbnail[^>]+url=["']([^"'>]+)["']/);
        if (m) image = m[1];
      }

      // 3. First <img src> inside content:encoded
      if (!image) {
        const encoded =
          item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] || '';
        const m = encoded.match(/<img[^>]+src=["']([^"'>]+)["']/);
        if (m) image = m[1];
      }

      // 4. enclosure tag
      if (!image) {
        const m = item.match(/<enclosure[^>]+url=["']([^"'>]+)["']/);
        if (m) image = m[1];
      }

      // Skip empty items
      if (!title.trim()) continue;

      items.push({
        id: link || title,
        title: title.trim(),
        link: link.trim(),
        author: author.trim(),
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        description,
        categories,
        image,
      });
    }

    return items;
  } catch (error) {
    console.error('[news_movies] Parse error:', error);
    return [];
  }
};


// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch latest movie news, trying sources in priority order until one succeeds.
 *
 * @param {number} limit - Max articles to return (default 10)
 * @returns {Promise<Array>} Normalised article array
 */
export const getMovieNews = async (limit = 10) => {
  let lastError = null;

  for (const source of MOVIE_RSS_SOURCES) {
    try {
      const response = await axios.get(source.url, HTTP_CONFIG);
      const articles = parseMovieRSS(response.data, source.defaultAuthor);

      if (articles.length > 0) {
        return articles
          .sort((a, b) => b.publishedAt - a.publishedAt)
          .slice(0, limit);
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
