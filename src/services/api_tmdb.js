/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                                                                  ║
 * ║    ████████╗███╗   ███╗██████╗ ██████╗                           ║
 * ║    ╚══██╔══╝████╗ ████║██╔══██╗██╔══██╗                          ║
 * ║       ██║   ██╔████╔██║██║  ██║██████╔╝                          ║
 * ║       ██║   ██║╚██╔╝██║██║  ██║██╔══██╗                          ║
 * ║       ██║   ██║ ╚═╝ ██║██████╔╝██████╔╝                          ║
 * ║       ╚═╝   ╚═╝     ╚═╝╚═════╝ ╚═════╝                          ║
 * ║                                                                  ║
 * ║    Powered by TMDB · api.themoviedb.org/3                        ║
 * ║                                                                  ║
 * ║    Purpose : Movie lists, search, details, and card data.        ║
 * ║              Used for Home, Discover, Upcoming, Podium, Search.  ║
 * ║                                                                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  SETUP                                                           ║
 * ║  ─────────────────────────────────────────────────────────────   ║
 * ║  1. Register at https://www.themoviedb.org/settings/api          ║
 * ║  2. Add to .env:  EXPO_PUBLIC_TMDB_API_KEY=your_key_here         ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import axios from 'axios';
import { runRequestWithPolicy } from './requestPolicy';
import { cacheGet, cacheSet } from './cacheManager';

// ===========================================
// BASE CONFIGURATION
// ===========================================

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';

// Image size presets
const IMAGE_SIZES = {
  poster: '/w500',
  backdrop: '/w1280',
  profile: '/w185',
  posterSmall: '/w342',
};

// Cache durations (milliseconds)
const CACHE_DURATION = {
  TMDB_TRENDING:  6 * 60 * 60 * 1000,      // 6 hours
  TMDB_POPULAR:   6 * 60 * 60 * 1000,       // 6 hours
  TMDB_NOW:       6 * 60 * 60 * 1000,       // 6 hours
  TMDB_UPCOMING:  6 * 60 * 60 * 1000,       // 6 hours
  TMDB_DETAILS:   24 * 60 * 60 * 1000,      // 24 hours
  TMDB_SEARCH:    1 * 60 * 60 * 1000,       // 1 hour
};

// ===========================================
// CACHE HELPERS
// ===========================================

const getCachedData = async (key) => {
  try {
    const prefix = key.split(':')[0];
    const maxAge = CACHE_DURATION[prefix] || CACHE_DURATION.TMDB_DETAILS;
    return cacheGet(key, { ttl: maxAge });
  } catch (e) {
    console.error('TMDB cache read error:', e);
    return null;
  }
};

const setCachedData = async (key, data) => {
  try {
    const prefix = key.split(':')[0];
    const ttl = CACHE_DURATION[prefix] || CACHE_DURATION.TMDB_DETAILS;
    await cacheSet(key, data, { ttl, namespace: 'TMDB' });
  } catch (e) {
    console.error('TMDB cache write error:', e);
  }
};

// ===========================================
// API REQUEST HELPER
// ===========================================

const tmdbRequest = async (endpoint, params = {}, cacheKey = null) => {
  if (cacheKey) {
    const cached = await getCachedData(cacheKey);
    if (cached) return cached;
  }

  const requestKey = `tmdb:${endpoint}:${JSON.stringify(params)}`;

  try {
    const data = await runRequestWithPolicy({
      dedupeKey: requestKey,
      requestFn: async () => {
        const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
          params: {
            api_key: TMDB_API_KEY,
            language: 'en-US',
            ...params,
          },
        });
        return response.data;
      },
    });

    if (cacheKey) {
      await setCachedData(cacheKey, data);
    }

    return data;
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// IMAGE URL BUILDER
// ===========================================

const getPosterUrl = (path) =>
  path ? `${TMDB_IMAGE_BASE}${IMAGE_SIZES.poster}${path}` : null;

const getBackdropUrl = (path) =>
  path ? `${TMDB_IMAGE_BASE}${IMAGE_SIZES.backdrop}${path}` : null;

// ===========================================
// DATA FORMATTER
// ===========================================

/**
 * Format raw TMDB movie object into our standard card shape.
 * This is used everywhere — Home, Discover, Podium, Search.
 */
export const formatMovieData = (movie) => ({
  id: movie.id,
  title: movie.title || movie.original_title || 'Untitled',
  name: movie.title || movie.original_title || 'Untitled',
  year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
  releaseDate: movie.release_date || null,
  released: movie.release_date || null,
  coverImage: getPosterUrl(movie.poster_path),
  backdropImage: getBackdropUrl(movie.backdrop_path),
  background_image: getPosterUrl(movie.poster_path),
  description: movie.overview || '',
  score: movie.vote_average ? Math.round(movie.vote_average * 10) : null,
  rating: movie.vote_average || 0,
  voteCount: movie.vote_count || 0,
  popularity: movie.popularity || 0,
  genres: movie.genre_ids
    ? movie.genre_ids.map((gid) => GENRE_MAP[gid] || 'Unknown')
    : movie.genres
    ? movie.genres.map((g) => g.name)
    : [],
  genreIds: movie.genre_ids || [],
  adult: movie.adult || false,
  type: 'MOVIE',
});

// ===========================================
// GENRE ID → NAME MAP  (TMDB genre IDs)
// ===========================================

const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// ===========================================
// LIST ENDPOINTS
// ===========================================

/**
 * Get trending movies (daily/weekly)
 * @param {number} page  – Page number (1-indexed)
 * @param {number} _     – Ignored, kept for API parity with games/anime
 * @returns {{ results: Array, page, total_pages, total_results }}
 */
export const getTrendingMovies = async (page = 1, _ = 20) => {
  const cacheKey = `TMDB_TRENDING:page${page}`;
  return tmdbRequest('/trending/movie/week', { page }, cacheKey);
};

/**
 * Get popular movies
 */
export const getPopularMovies = async (page = 1, _ = 20) => {
  const cacheKey = `TMDB_POPULAR:page${page}`;
  return tmdbRequest('/movie/popular', { page }, cacheKey);
};

/**
 * Get now-playing movies (replaces "New")
 */
export const getNewMovies = async (page = 1, _ = 20) => {
  const cacheKey = `TMDB_NOW:page${page}`;
  return tmdbRequest('/movie/now_playing', { page }, cacheKey);
};

/**
 * Get upcoming movies
 */
export const getUpcomingMovies = async (page = 1, _ = 20) => {
  const cacheKey = `TMDB_UPCOMING:page${page}`;
  return tmdbRequest('/movie/upcoming', { page }, cacheKey);
};

// ===========================================
// DETAILS
// ===========================================

/**
 * Get full movie details by TMDB ID
 * Includes credits, videos, recommendations
 */
export const getMovieDetails = async (movieId) => {
  const cacheKey = `TMDB_DETAILS:${movieId}`;
  return tmdbRequest(
    `/movie/${movieId}`,
    { append_to_response: 'credits,videos,recommendations,images' },
    cacheKey
  );
};

// ===========================================
// SEARCH
// ===========================================

/**
 * Search movies by query string
 * @returns {{ results: Array, page, total_pages, total_results }}
 */
export const searchMovies = async (query, page = 1, _perPage = 20) => {
  const cacheKey = `TMDB_SEARCH:${query.toLowerCase().trim()}_p${page}`;
  const data = await tmdbRequest('/search/movie', { query, page, include_adult: false }, cacheKey);
  // Transform to match { media: [...] } shape used by search.js
  return {
    media: data.results || [],
    totalPages: data.total_pages || 1,
    totalResults: data.total_results || 0,
  };
};

export default {
  getTrendingMovies,
  getPopularMovies,
  getNewMovies,
  getUpcomingMovies,
  getMovieDetails,
  searchMovies,
  formatMovieData,
  getPosterUrl,
  getBackdropUrl,
};
