/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                                                                  ║
 * ║    ██████╗  █████╗ ██╗    ██╗ ██████╗                           ║
 * ║    ██╔══██╗██╔══██╗██║    ██║██╔════╝                           ║
 * ║    ██████╔╝███████║██║ █╗ ██║██║  ███╗                          ║
 * ║    ██╔══██╗██╔══██║██║███╗██║██║   ██║                          ║
 * ║    ██║  ██║██║  ██║╚███╔███╔╝╚██████╔╝                          ║
 * ║    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝  ╚═════╝                          ║
 * ║                                                                  ║
 * ║    Powered by RAWG · api.rawg.io/api                            ║
 * ║                                                                  ║
 * ║    Purpose : Game lists, search, and lightweight card data.      ║
 * ║              Used for Home, Discover, Upcoming, and Podium.     ║
 * ║                                                                  ║
 * ║    For rich game details (story, modes, trailers, companies)     ║
 * ║    see → src/services/api_igdb.js  (Twitch / IGDB)             ║
 * ║                                                                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  SETUP                                                           ║
 * ║  ─────────────────────────────────────────────────────────────  ║
 * ║  1. Register at https://rawg.io/apidocs                         ║
 * ║  2. Add to .env:  EXPO_PUBLIC_RAWG_API_KEY=your_key_here        ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===========================================
// BASE CONFIGURATION
// ===========================================

const RAWG_API_URL = 'https://api.rawg.io/api';
const RAWG_API_KEY = process.env.EXPO_PUBLIC_RAWG_API_KEY || 'YOUR_API_KEY_HERE';

// Cache configuration (in milliseconds)
const CACHE_DURATION = {
  TRENDING: 6 * 60 * 60 * 1000,      // 6 hours
  POPULAR: 6 * 60 * 60 * 1000,       // 6 hours
  NEW_RELEASES: 6 * 60 * 60 * 1000,  // 6 hours
  GAME_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
  SEARCH: 1 * 60 * 60 * 1000,        // 1 hour
  GENRES: 7 * 24 * 60 * 60 * 1000,   // 7 days
  PLATFORMS: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ===========================================
// CACHE HELPER FUNCTIONS
// ===========================================

/**
 * Get cached data if valid
 * @param {string} key - Cache key
 * @returns {Promise<object|null>} - Cached data or null
 */
const getCachedData = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const cacheKey = key.split(':')[0];
    const maxAge = CACHE_DURATION[cacheKey] || CACHE_DURATION.GAME_DETAILS;

    // Check if cache is still valid
    if (Date.now() - timestamp < maxAge) {
      console.log(`✅ Cache hit: ${key}`);
      return data;
    }

    // Cache expired
    console.log(`⏰ Cache expired: ${key}`);
    await AsyncStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 */
const setCachedData = async (key, data) => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheObject));
    console.log(`💾 Cached: ${key}`);
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// ===========================================
// API REQUEST HELPER
// ===========================================

/**
 * Execute a GET request to RAWG API with caching
 * @param {string} endpoint - API endpoint (e.g., '/games')
 * @param {object} params - Query parameters
 * @param {string} cacheKey - Cache key for this request
 * @returns {Promise<object>} - API response data
 */
const executeRequest = async (endpoint, params = {}, cacheKey = null) => {
  // Check cache first
  if (cacheKey) {
    const cached = await getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const response = await axios.get(`${RAWG_API_URL}${endpoint}`, {
      params: {
        key: RAWG_API_KEY,
        ...params,
      },
    });

    // Cache the response
    if (cacheKey) {
      await setCachedData(cacheKey, response.data);
    }

    return response.data;
  } catch (error) {
    console.error('RAWG API Error:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// API FUNCTIONS
// ===========================================

/**
 * Get trending games (recently added, highly rated)
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 20, max: 40)
 * @returns {Promise<object>} - Trending games list
 */
export const getTrendingGames = async (page = 1, pageSize = 20) => {
  const cacheKey = `TRENDING:page${page}_size${pageSize}`;
  
  return executeRequest('/games', {
    page,
    page_size: pageSize,
    ordering: '-added', // Recently added
    metacritic: '75,100', // High quality games only
  }, cacheKey);
};

/**
 * Get popular games (by rating and popularity)
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 20, max: 40)
 * @returns {Promise<object>} - Popular games list
 */
export const getPopularGames = async (page = 1, pageSize = 20) => {
  const cacheKey = `POPULAR:page${page}_size${pageSize}`;
  
  return executeRequest('/games', {
    page,
    page_size: pageSize,
    ordering: '-rating', // Highest rated
  }, cacheKey);
};

/**
 * Get new releases (games released in the last 30 days)
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 20, max: 40)
 * @returns {Promise<object>} - New releases list
 */
export const getNewReleases = async (page = 1, pageSize = 20) => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
  const dateString = thirtyDaysAgo.toISOString().split('T')[0];
  
  const cacheKey = `NEW_RELEASES:page${page}_size${pageSize}`;
  
  return executeRequest('/games', {
    page,
    page_size: pageSize,
    dates: `${dateString},${new Date().toISOString().split('T')[0]}`,
    ordering: '-released',
  }, cacheKey);
};

/**
 * Get upcoming games (not yet released)
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 20, max: 40)
 * @returns {Promise<object>} - Upcoming games list
 */
export const getUpcomingGames = async (page = 1, pageSize = 20) => {
  const today = new Date().toISOString().split('T')[0];
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const futureDate = oneYearLater.toISOString().split('T')[0];
  
  const cacheKey = `UPCOMING:page${page}_size${pageSize}`;
  
  return executeRequest('/games', {
    page,
    page_size: pageSize,
    dates: `${today},${futureDate}`,
    ordering: '-added',
  }, cacheKey);
};

/**
 * Get game details by ID
 * @param {number} id - RAWG game ID
 * @returns {Promise<object>} - Detailed game information
 */
export const getGameDetails = async (id) => {
  const cacheKey = `GAME_DETAILS:${id}`;
  
  return executeRequest(`/games/${id}`, {}, cacheKey);
};

/**
 * Get game screenshots
 * @param {number} gameId - RAWG game ID
 * @returns {Promise<object>} - Game screenshots
 */
export const getGameScreenshots = async (gameId) => {
  const cacheKey = `SCREENSHOTS:${gameId}`;
  
  return executeRequest(`/games/${gameId}/screenshots`, {}, cacheKey);
};

/**
 * Get game achievements (if available)
 * @param {number} gameId - RAWG game ID
 * @returns {Promise<object>} - Game achievements
 */
export const getGameAchievements = async (gameId) => {
  const cacheKey = `ACHIEVEMENTS:${gameId}`;
  
  return executeRequest(`/games/${gameId}/achievements`, {}, cacheKey);
};

/**
 * Get game series/DLC
 * @param {number} gameId - RAWG game ID
 * @returns {Promise<object>} - Game series
 */
export const getGameSeries = async (gameId) => {
  const cacheKey = `SERIES:${gameId}`;
  
  return executeRequest(`/games/${gameId}/game-series`, {}, cacheKey);
};

/**
 * Search games by title
 * @param {string} query - Search query
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 20, max: 40)
 * @returns {Promise<object>} - Search results
 */
export const searchGames = async (query, page = 1, pageSize = 20) => {
  if (!query || query.trim() === '') {
    return { results: [], count: 0 };
  }

  const cacheKey = `SEARCH:${query}_page${page}_size${pageSize}`;
  
  return executeRequest('/games', {
    search: query,
    page,
    page_size: pageSize,
    search_precise: true,
  }, cacheKey);
};

/**
 * Get games with advanced filters
 * @param {object} filters - Filter options
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 20, max: 40)
 * @returns {Promise<object>} - Filtered games list
 */
export const getGamesWithFilters = async (filters = {}, page = 1, pageSize = 20) => {
  const {
    genres,        // Comma-separated genre IDs (e.g., '4,51')
    platforms,     // Comma-separated platform IDs (e.g., '4,187')
    dates,         // Date range (e.g., '2020-01-01,2023-12-31')
    ordering,      // Sort order (e.g., '-rating', '-released')
    metacritic,    // Metacritic score range (e.g., '80,100')
  } = filters;

  const params = {
    page,
    page_size: pageSize,
  };

  if (genres) params.genres = genres;
  if (platforms) params.platforms = platforms;
  if (dates) params.dates = dates;
  if (ordering) params.ordering = ordering;
  if (metacritic) params.metacritic = metacritic;

  // Don't cache filtered results (too many combinations)
  return executeRequest('/games', params);
};

/**
 * Get all genres
 * @returns {Promise<object>} - Genres list
 */
export const getGenres = async () => {
  const cacheKey = 'GENRES:all';
  
  return executeRequest('/genres', {}, cacheKey);
};

/**
 * Get all platforms
 * @returns {Promise<object>} - Platforms list
 */
export const getPlatforms = async () => {
  const cacheKey = 'PLATFORMS:all';
  
  return executeRequest('/platforms', {}, cacheKey);
};

/**
 * Get all stores (Steam, Epic, PlayStation Store, etc.)
 * @returns {Promise<object>} - Stores list
 */
export const getStores = async () => {
  const cacheKey = 'STORES:all';
  
  return executeRequest('/stores', {}, cacheKey);
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Format game data for app consumption
 * @param {object} game - Raw RAWG game object
 * @returns {object} - Formatted game object
 */
export const formatGameData = (game) => {
  return {
    id: game.id,
    name: game.name,
    slug: game.slug,
    coverImage: game.background_image,
    rating: game.rating,
    ratingCount: game.ratings_count,
    metacritic: game.metacritic,
    released: game.released,
    platforms: game.platforms?.map(p => ({
      id: p.platform.id,
      name: p.platform.name,
      slug: p.platform.slug,
    })) || [],
    genres: game.genres?.map(g => g.name) || [],
    description: game.description_raw || game.description || '',
    playtime: game.playtime, // Average playtime in hours
    esrbRating: game.esrb_rating?.name || 'Not Rated',
    developers: game.developers?.map(d => d.name) || [],
    publishers: game.publishers?.map(p => p.name) || [],
    tags: game.tags?.slice(0, 5).map(t => t.name) || [], // Top 5 tags
  };
};

/**
 * Get platform icon name for display
 * @param {string} platformName - Platform name
 * @returns {string} - Icon name or emoji
 */
export const getPlatformIcon = (platformName) => {
  const lowerName = platformName.toLowerCase();
  
  if (lowerName.includes('pc') || lowerName.includes('windows')) return '💻';
  if (lowerName.includes('playstation') || lowerName.includes('ps')) return '🎮';
  if (lowerName.includes('xbox')) return '🎮';
  if (lowerName.includes('nintendo') || lowerName.includes('switch')) return '🎮';
  if (lowerName.includes('ios') || lowerName.includes('android') || lowerName.includes('mobile')) return '📱';
  if (lowerName.includes('mac')) return '🍎';
  if (lowerName.includes('linux')) return '🐧';
  
  return '🎮'; // Default
};

/**
 * Get Metacritic color based on score
 * @param {number} score - Metacritic score (0-100)
 * @returns {string} - Color hex code
 */
export const getMetacriticColor = (score) => {
  if (!score) return '#999999'; // Gray for no score
  if (score >= 75) return '#10B981'; // Green
  if (score >= 50) return '#FFBE0B'; // Yellow
  return '#EF4444'; // Red
};

/**
 * Format release date
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date (e.g., "Jan 15, 2024")
 */
export const formatReleaseDate = (dateString) => {
  if (!dateString) return 'TBA';
  
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Clear all game cache
 */
export const clearGameCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const gameCacheKeys = keys.filter(key => 
      key.startsWith('TRENDING:') ||
      key.startsWith('POPULAR:') ||
      key.startsWith('NEW_RELEASES:') ||
      key.startsWith('GAME_DETAILS:') ||
      key.startsWith('SEARCH:') ||
      key.startsWith('GENRES:') ||
      key.startsWith('PLATFORMS:')
    );
    
    await AsyncStorage.multiRemove(gameCacheKeys);
    console.log(`🗑️ Cleared ${gameCacheKeys.length} cache entries`);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

// ===========================================
// DEFAULT EXPORT
// ===========================================

export default {
  getTrendingGames,
  getPopularGames,
  getNewReleases,
  getUpcomingGames,
  getGameDetails,
  getGameScreenshots,
  getGameAchievements,
  getGameSeries,
  searchGames,
  getGamesWithFilters,
  getGenres,
  getPlatforms,
  getStores,
  formatGameData,
  getPlatformIcon,
  getMetacriticColor,
  formatReleaseDate,
  clearGameCache,
};
