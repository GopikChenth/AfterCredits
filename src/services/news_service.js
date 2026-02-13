import axios from 'axios';

const RSS_FEED_URL = 'https://animecorner.me/feed/';

/**
 * Parse RSS XML to extract news articles
 * @param {string} xmlText - RSS XML content
 * @returns {Array} - Array of news articles
 */
const parseRSSFeed = (xmlText) => {
  try {
    // Extract all <item> elements
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      
      // Extract fields from each item
      const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                    itemContent.match(/<title>(.*?)<\/title>/)?.[1] || '';
      
      const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || '';
      
      const creator = itemContent.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/)?.[1] || 
                      'Anime Corner';
      
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
      
      // Try to find image in content:encoded
      const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"'>]+)["']/);
      if (imgMatch) {
        image = imgMatch[1];
      }
      
      // Fallback to media:content if no image found
      if (!image) {
        const mediaMatch = itemContent.match(/<media:content[^>]+url=["']([^"'>]+)["']/);
        if (mediaMatch) {
          image = mediaMatch[1];
        }
      }

      items.push({
        id: link,
        title: title.trim(),
        link: link.trim(),
        author: creator.trim(),
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        description: description.trim().replace(/&hellip;/g, '...').replace(/&#038;/g, '&'),
        categories,
        image,
      });
    }

    return items;
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return [];
  }
};

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
    const response = await axios.get(RSS_FEED_URL, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      timeout: 10000,
    });

    const articles = parseRSSFeed(response.data);
    
    // Sort by date (newest first) and limit - NO pre-fetching images
    return articles
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, limit);
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
