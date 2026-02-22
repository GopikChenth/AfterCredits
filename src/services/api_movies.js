/**
 * Movie API Service — TMDB v3
 * Fetches trending, popular, now-playing, and search results from The Movie Database.
 */
import axios from 'axios';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// ── helpers ──────────────────────────────────────────────────────────

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: API_KEY, language: 'en-US' },
});

/**
 * Normalise a TMDB movie object into the shape the app expects.
 */
export const formatMovieData = (movie) => ({
  id: movie.id,
  title: movie.title || movie.original_title || 'Untitled',
  year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
  coverImage: movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : null,
  backdropImage: movie.backdrop_path ? `${IMG_BASE}${movie.backdrop_path}` : null,
  description: movie.overview || '',
  score: movie.vote_average ? Math.round(movie.vote_average * 10) : 0, // 0-100 scale
  popularity: Math.round(movie.popularity) || 0,
  type: 'MOVIE',
});

// ── public API ───────────────────────────────────────────────────────

export const getTrendingMovies = async (page = 1, perPage = 20) => {
  try {
    const { data } = await tmdb.get('/trending/movie/week', { params: { page } });
    return {
      media: data.results.map(formatMovieData),
      pageInfo: {
        currentPage: data.page,
        totalPages: data.total_pages,
        hasNextPage: data.page < data.total_pages,
      },
    };
  } catch (err) {
    console.error('TMDB getTrendingMovies error:', err.message);
    throw err;
  }
};

export const getPopularMovies = async (page = 1, perPage = 20) => {
  try {
    const { data } = await tmdb.get('/movie/popular', { params: { page } });
    return {
      media: data.results.map(formatMovieData),
      pageInfo: {
        currentPage: data.page,
        totalPages: data.total_pages,
        hasNextPage: data.page < data.total_pages,
      },
    };
  } catch (err) {
    console.error('TMDB getPopularMovies error:', err.message);
    throw err;
  }
};

export const getNewMovies = async (page = 1, perPage = 20) => {
  try {
    const { data } = await tmdb.get('/movie/now_playing', { params: { page } });
    return {
      media: data.results.map(formatMovieData),
      pageInfo: {
        currentPage: data.page,
        totalPages: data.total_pages,
        hasNextPage: data.page < data.total_pages,
      },
    };
  } catch (err) {
    console.error('TMDB getNewMovies error:', err.message);
    throw err;
  }
};

export const searchMovies = async (query, page = 1, perPage = 20) => {
  try {
    const { data } = await tmdb.get('/search/movie', {
      params: { query, page, include_adult: false },
    });
    return {
      media: data.results.map(formatMovieData),
      pageInfo: {
        currentPage: data.page,
        totalPages: data.total_pages,
        hasNextPage: data.page < data.total_pages,
      },
    };
  } catch (err) {
    console.error('TMDB searchMovies error:', err.message);
    throw err;
  }
};

export const getMovieDetails = async (movieId) => {
  try {
    const { data } = await tmdb.get(`/movie/${movieId}`, {
      params: { append_to_response: 'credits,recommendations,reviews,videos,images' },
    });
    return data;
  } catch (err) {
    console.error('TMDB getMovieDetails error:', err.message);
    throw err;
  }
};

/**
 * Upcoming movies (future release dates).
 * Uses TMDB's /movie/upcoming endpoint which returns movies with
 * release dates in the near future.
 */
export const getUpcomingMovies = async (page = 1, perPage = 20) => {
  try {
    const { data } = await tmdb.get('/movie/upcoming', { params: { page } });
    return {
      results: data.results.map(formatMovieData),
      pageInfo: {
        currentPage: data.page,
        totalPages: data.total_pages,
        hasNextPage: data.page < data.total_pages,
      },
    };
  } catch (err) {
    console.error('TMDB getUpcomingMovies error:', err.message);
    throw err;
  }
};

export default {
  getTrendingMovies,
  getPopularMovies,
  getNewMovies,
  searchMovies,
  getMovieDetails,
  getUpcomingMovies,
  formatMovieData,
};
