/**
 * Gaming News Service
 * Fetches gaming news from Insider Gaming RSS feed
 * 
 * Source: https://insider-gaming.com/feed/
 */

import axios from 'axios';

const GAMING_RSS_URL = 'https://insider-gaming.com/feed/';

/**
 * Parse RSS XML to extract gaming news articles
 * @param {string} xmlText - RSS XML content
 * @returns {Array} - Array of news articles
 */
const parseGamingRSS = (xmlText) => {
  try {
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                    itemContent.match(/<title>(.*?)<\/title>/)?.[1] || '';

      const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || '';

      const creator = itemContent.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/)?.[1] ||
                      'Insider Gaming';

      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

      const description = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '';

      // Extract categories
      const categoryRegex = /<category><!\[CDATA\[(.*?)\]\]><\/category>/g;
      const categories = [];
      let categoryMatch;
      while ((categoryMatch = categoryRegex.exec(itemContent)) !== null) {
        categories.push(categoryMatch[1]);
      }

      // Extract image from content:encoded or media:content
      const contentEncoded = itemContent.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] || '';
      let image = null;

      const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"'>]+)["']/);
      if (imgMatch) {
        image = imgMatch[1];
      }

      if (!image) {
        const mediaMatch = itemContent.match(/<media:content[^>]+url=["']([^"'>]+)["']/);
        if (mediaMatch) {
          image = mediaMatch[1];
        }
      }

      // Fallback: try enclosure tag
      if (!image) {
        const enclosureMatch = itemContent.match(/<enclosure[^>]+url=["']([^"'>]+)["']/);
        if (enclosureMatch) {
          image = enclosureMatch[1];
        }
      }

      items.push({
        id: link,
        title: title.trim(),
        link: link.trim(),
        author: creator.trim(),
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        description: description.trim()
          .replace(/&hellip;/g, '...')
          .replace(/&#038;/g, '&')
          .replace(/<[^>]*>/g, ''), // Strip HTML tags
        categories,
        image,
      });
    }

    return items;
  } catch (error) {
    console.error('Error parsing gaming RSS feed:', error);
    return [];
  }
};

/**
 * Fetch latest gaming news from Insider Gaming
 * @param {number} limit - Maximum number of articles to return
 * @returns {Promise<Array>} - Array of news articles
 */
export const getGamingNews = async (limit = 10) => {
  try {
    const response = await axios.get(GAMING_RSS_URL, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; AfterCredits/1.0)',
      },
      timeout: 10000,
    });

    const articles = parseGamingRSS(response.data);

    return articles
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching gaming news:', error);
    throw error;
  }
};

export default {
  getGamingNews,
};
