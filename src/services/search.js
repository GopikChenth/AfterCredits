/**
 * Unified Search API Service
 * Handles search across all media types: Anime, Movies, Games, Comics, Manga
 */

import { searchAnime, formatAnimeData } from './api_anime';
import { searchMovies, formatMovieData } from './api_movies';

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
        response = await searchMovies(query, 1, limit);
        // Movies API returns { media: [...] } structure
        results = response.media ? response.media.map(formatMovieData) : [];
        break;
      
      case 'game':
        // TODO: Implement game search API
        console.log('Game search not yet implemented');
        return [];
      
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

    // Sort by popularity (highest first)
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
