import axios from 'axios';
import { parseRssItems } from './rssParser';
import { cacheGet, cacheSet } from './cacheManager';

const RSS_FEED_URL = 'https://animecorner.me/feed/';

// Cache TTL: 30 minutes
const NEWS_CACHE_TTL = 30 * 60 * 1000;
const ANIME_NEWS_CACHE_KEY = 'NEWS_CACHE:anime';

/**
 * Fetch Open Graph image from article page
 * @param {string} url - Article URL
 * @returns {Promise<string|null>} - Image URL or null
 */
export const fetchArticleImage = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AfterCredits/1.0)',
      },
    });
    
    // Extract og:image from HTML
    const ogImageMatch = response.data.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      return ogImageMatch[1];
    }
    
    // Fallback to twitter:image
    const twitterImageMatch = response.data.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (twitterImageMatch) {
      return twitterImageMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching image for ${url}:`, error.message);
    return null;
  }
};

/**
 * Fetch latest anime news from Anime Corner
 * @param {number} limit - Maximum number of articles to return
 * @returns {Promise<Array>} - Array of news articles
 */
export const getAnimeNews = async (limit = 20) => {
  try {
    // Check cache first
    const cached = await cacheGet(ANIME_NEWS_CACHE_KEY, { ttl: NEWS_CACHE_TTL });
    if (cached) {
      return cached.slice(0, limit);
    }

    const response = await axios.get(RSS_FEED_URL, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      timeout: 10000,
    });

    const articles = parseRssItems(response.data, { defaultAuthor: 'Anime Corner' });
    
    // Sort by date (newest first)
    const sorted = articles.sort((a, b) => b.publishedAt - a.publishedAt);

    // Persist to cache (store all articles, slice on read)
    await cacheSet(ANIME_NEWS_CACHE_KEY, sorted, {
      ttl: NEWS_CACHE_TTL,
      namespace: 'NEWS',
    });

    return sorted.slice(0, limit);
  } catch (error) {
    console.error('Error fetching anime news:', error);
    throw error;
  }
};

/**
 * Format time ago string
 * @param {Date} date - Date to format
 * @returns {string} - Formatted time string (e.g., "2 hours ago")
 */
export const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default {
  getAnimeNews,
  fetchArticleImage,
  formatTimeAgo,
};
