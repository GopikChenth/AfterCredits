/**
 * Gaming News Service
 * Fetches gaming news from Insider Gaming RSS feed
 * 
 * Source: https://insider-gaming.com/feed/
 */

import axios from 'axios';
import { parseRssItems } from './rssParser';
import { cacheGet, cacheSet } from './cacheManager';

const GAMING_RSS_URL = 'https://insider-gaming.com/feed/';

// Cache TTL: 30 minutes
const NEWS_CACHE_TTL = 30 * 60 * 1000;
const GAMES_NEWS_CACHE_KEY = 'NEWS_CACHE:games';

/**
 * Fetch latest gaming news from Insider Gaming
 * @param {number} limit - Maximum number of articles to return
 * @returns {Promise<Array>} - Array of news articles
 */
export const getGamingNews = async (limit = 10) => {
  try {
    // Check cache first
    const cached = await cacheGet(GAMES_NEWS_CACHE_KEY, { ttl: NEWS_CACHE_TTL });
    if (cached) {
      return cached.slice(0, limit);
    }

    const response = await axios.get(GAMING_RSS_URL, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; AfterCredits/1.0)',
      },
      timeout: 10000,
    });

    const articles = parseRssItems(response.data, { defaultAuthor: 'Insider Gaming' });
    const sorted = articles.sort((a, b) => b.publishedAt - a.publishedAt);

    // Persist to cache
    await cacheSet(GAMES_NEWS_CACHE_KEY, sorted, {
      ttl: NEWS_CACHE_TTL,
      namespace: 'NEWS',
    });

    return sorted.slice(0, limit);
  } catch (error) {
    console.error('Error fetching gaming news:', error);
    throw error;
  }
};

export default {
  getGamingNews,
};
