/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                                                                  ║
 * ║    ██╗ ██████╗ ██████╗ ██████╗                                   ║
 * ║    ██║██╔════╝ ██╔══██╗██╔══██╗                                  ║
 * ║    ██║██║  ███╗██║  ██║██████╔╝                                  ║
 * ║    ██║██║   ██║██║  ██║██╔══██╗                                  ║
 * ║    ██║╚██████╔╝██████╔╝██████╔╝                                  ║
 * ║    ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝                                   ║
 * ║                                                                  ║
 * ║    Powered by Twitch OAuth2 · api.igdb.com/v4                    ║
 * ║                                                                  ║
 * ║    Purpose : Rich game details — story, modes, companies,        ║
 * ║              age ratings, similar games, screenshots, trailers.  ║
 * ║                                                                  ║
 * ║    Companion to api_rawg.js (RAWG) which handles lists,          ║
 * ║    search, and lightweight card data.                            ║
 * ║                                                                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  SETUP — 2 steps                                                 ║
 * ║  ─────────────────────────────────────────────────────────────  ║
 * ║                                                                  ║
 * ║  1. Register a Twitch app                                        ║
 * ║     → https://dev.twitch.tv/console/apps                        ║
 * ║     → Category: "Application Integration"                       ║
 * ║     → OAuth Redirect URL: http://localhost                       ║
 * ║     → Copy Client ID and generate a Client Secret               ║
 * ║                                                                  ║
 * ║  2. In app: Profile → IGDB API                                   ║
 * ║     Paste Client ID + Access Token and save.                     ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { runRequestWithPolicy } from './requestPolicy';
import { getIGDBCredentials } from './settings';
import { cacheGet, cacheSet, clearCacheByPrefixes } from './cacheManager';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const IGDB_BASE_URL = 'https://api.igdb.com/v4';

/**
 * Resolve the IGDB credentials.
 * Priority: user-saved credentials in AsyncStorage → environment variables.
 * Returns { clientId, accessToken } — either or both may be empty strings
 * if neither source provides them.
 */
const resolveCredentials = async () => {
  try {
    const { clientId, accessToken } = await getIGDBCredentials();
    return { clientId: clientId || '', accessToken: accessToken || '' };
  } catch {
    return { clientId: '', accessToken: '' };
  }
};

/** Cache durations in milliseconds */
const CACHE_DURATION = {
  IGDB_DETAILS:  24 * 60 * 60 * 1000,  // 24 hours
  IGDB_SEARCH:    1 * 60 * 60 * 1000,  // 1 hour
  IGDB_SIMILAR:  12 * 60 * 60 * 1000,  // 12 hours
};

// ─────────────────────────────────────────────────────────────────────────────
// CACHE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getCached = async (key) => {
  try {
    const data = await cacheGet(key);
    if (data) {
      console.log(`✅ IGDB cache hit: ${key}`);
    }
    return data;
  } catch {
    return null;
  }
};

const setCached = async (key, data, ttl) => {
  try {
    await cacheSet(key, data, { ttl, namespace: 'IGDB' });
  } catch (e) {
    console.warn('IGDB cache write error:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ping IGDB with a minimal query to verify credentials are valid.
 * @returns {Promise<{ ok: boolean, message: string, latencyMs: number }>}
 */
export const checkIGDBHealth = async () => {
  const { clientId, accessToken } = await resolveCredentials();
  if (!clientId || !accessToken) {
    return { ok: false, message: 'No IGDB credentials — add them in Settings', latencyMs: 0 };
  }

  const start = Date.now();
  try {
    const response = await fetch(`${IGDB_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
        'Accept': 'application/json',
      },
      body: 'fields name; limit 1;',
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 401) {
        return { ok: false, message: 'Token expired — regenerate your access token', latencyMs };
      }
      if (response.status === 403) {
        return { ok: false, message: 'Invalid Client ID or token', latencyMs };
      }
      return { ok: false, message: `IGDB ${response.status}: ${text}`, latencyMs };
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return { ok: true, message: `Connected — ${latencyMs}ms`, latencyMs };
    }
    return { ok: false, message: 'Unexpected empty response', latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - start;
    return { ok: false, message: error.message || 'Network error', latencyMs };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE REQUEST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute a POST request against the IGDB API.
 * IGDB uses POST with a plain-text body (Apicalypse query language).
 *
 * @param {string} endpoint  - e.g. 'games', 'companies', 'screenshots'
 * @param {string} query     - Apicalypse query string
 * @param {string} [cacheKey]
 * @param {number} [ttl]     - Cache TTL in ms
 */
const igdbRequest = async (endpoint, query, cacheKey = null, ttl = CACHE_DURATION.IGDB_DETAILS) => {
  const { clientId, accessToken } = await resolveCredentials();
  if (!clientId || !accessToken) {
    console.warn(
      '⚠️  IGDB credentials missing.\n' +
      '   Add them via Settings > IGDB API in your profile.'
    );
    return [];
  }

  if (cacheKey) {
    const cached = await getCached(cacheKey);
    if (cached) return cached;
  }

  const requestKey = `igdb:${endpoint}:${query}`;

  try {
    const data = await runRequestWithPolicy({
      dedupeKey: requestKey,
      requestFn: async () => {
        const response = await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
            'Accept': 'application/json',
          },
          body: query,
        });

        if (!response.ok) {
          const text = await response.text();
          const igdbError = new Error(`IGDB ${response.status}: ${text}`);
          igdbError.status = response.status;
          throw igdbError;
        }

        return response.json();
      },
    });

    if (cacheKey) await setCached(cacheKey, data, ttl);
    return data;
  } catch (error) {
    console.error(`IGDB request failed [${endpoint}]:`, error.message);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Search IGDB for a game by name.
 * Used to resolve a RAWG game name → IGDB id before fetching full details.
 *
 * @param {string} name - Game name (from RAWG)
 * @returns {Promise<Array>} - Array of matching games (id, name, cover)
 */
export const searchGameIGDB = async (name) => {
  const cacheKey = `IGDB_RESOLVE:${name.toLowerCase().replace(/\s+/g, '_')}`;
  return igdbRequest(
    'games',
    `search "${name}";
     fields id, name, cover.url, first_release_date;
     limit 6;`,
    cacheKey,
    CACHE_DURATION.IGDB_SEARCH
  );
};

/**
 * Search IGDB for games — richer version for the discover/search UI.
 * Returns formatted results compatible with InlineSearchResults & SearchSuggestions.
 *
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 20)
 * @returns {Promise<Array>} - Array of { id, title, coverImage, year, genres, popularity }
 */
export const searchGamesIGDB = async (query, limit = 20) => {
  const cacheKey = `IGDB_SEARCH_V2:${query.toLowerCase().replace(/\s+/g, '_')}:${limit}`;
  const raw = await igdbRequest(
    'games',
    `search "${query}";
     fields id, name, cover.url, cover.image_id, first_release_date,
            genres.name, total_rating, total_rating_count, category;
     limit ${limit};`,
    cacheKey,
    CACHE_DURATION.IGDB_SEARCH
  );

  return (raw || []).map(game => ({
    id: game.id,
    title: game.name,
    coverImage: game.cover?.image_id
      ? igdbImageUrl(game.cover.image_id, 'cover_big')
      : game.cover?.url?.replace('t_thumb', 't_cover_big') || null,
    year: game.first_release_date
      ? new Date(game.first_release_date * 1000).getFullYear().toString()
      : '',
    genres: (game.genres || []).map(g => g.name),
    popularity: game.total_rating_count || 0,
    rating: game.total_rating ? Math.round(game.total_rating) : null,
  }));
};

/**
 * Get full game details from IGDB by IGDB game id.
 *
 * @param {number} igdbId - IGDB game id
 * @returns {Promise<Array>} - Array with one game object (full details)
 */
export const getGameDetailsIGDB = async (igdbId) => {
  const cacheKey = `IGDB_DETAILS:${igdbId}`;
  return igdbRequest(
    'games',
    `where id = ${igdbId};
     fields
       name,
       summary,
       storyline,
       cover.url,
       cover.image_id,
       screenshots.url,
       screenshots.image_id,
       videos.video_id,
       videos.name,
       genres.name,
       themes.name,
       game_modes.name,
       involved_companies.company.name,
       involved_companies.developer,
       involved_companies.publisher,
       involved_companies.porting,
       age_ratings.category,
       age_ratings.rating,
       similar_games.id,
       similar_games.name,
       similar_games.cover.url,
       similar_games.cover.image_id,
       similar_games.genres.name,
       platforms.name,
       platforms.abbreviation,
       first_release_date,
       total_rating,
       total_rating_count,
       franchise.name,
       franchises.name,
       collection.name,
       status;
     limit 1;`,
    cacheKey,
    CACHE_DURATION.IGDB_DETAILS
  );
};

/**
 * Fetch DLCs / Expansions / Season Passes for a game.
 * IGDB category codes: 1=DLC, 2=Expansion, 3=Bundle, 4=Standalone, 14=Season Pass
 *
 * @param {number} igdbId - Parent game IGDB id
 * @returns {Promise<Array>} Array of { id, name, coverImage, category, releaseDate }
 */
export const getGameDLCs = async (igdbId) => {
  if (!igdbId) return [];
  try {
    const cacheKey = `IGDB_DLCS:${igdbId}`;
    const data = await igdbRequest(
      'games',
      `fields name, cover.image_id, cover.url, category, first_release_date;
       where parent_game = ${igdbId} & category = (1,2,3,4,14);
       sort first_release_date asc;
       limit 30;`,
      cacheKey,
      CACHE_DURATION.IGDB_DETAILS
    );
    if (!data || data.length === 0) return [];
    const CATEGORY_LABEL = { 1: 'DLC', 2: 'Expansion', 3: 'Bundle', 4: 'Standalone', 14: 'Season Pass' };
    return data.map(d => ({
      id: d.id,
      name: d.name,
      coverImage: d.cover?.image_id
        ? igdbImageUrl(d.cover.image_id, 'cover_small')
        : d.cover?.url?.replace('t_thumb', 't_cover_small') || null,
      category: CATEGORY_LABEL[d.category] || 'DLC',
      releaseDate: d.first_release_date
        ? new Date(d.first_release_date * 1000).getFullYear()
        : null,
    }));
  } catch (e) {
    console.warn('getGameDLCs error:', e.message);
    return [];
  }
};

/**
 * Fetch time-to-beat data for a game from IGDB.
 *
 * @param {number} gameId - IGDB game id
 * @returns {Promise<object|null>} - { hastily, normally, completely } in seconds, or null
 */
export const getTimeToBeat = async (gameId) => {
  try {
    const cacheKey = `IGDB_TTB:${gameId}`;
    const data = await igdbRequest(
      'game_time_to_beats',
      `where game_id = ${gameId};
       fields hastily, normally, completely, count;
       limit 1;`,
      cacheKey,
      CACHE_DURATION.IGDB_DETAILS
    );
    if (!data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
};

/**
 * Hybrid fetch: resolve RAWG name → IGDB id → full IGDB details + time-to-beat.
 * Returns null if IGDB lookup fails (caller should fall back to RAWG data).
 *
 * @param {string} gameName - Game name from RAWG
 * @returns {Promise<object|null>} - Formatted IGDB game object or null
 */
export const fetchIGDBByName = async (gameName) => {
  try {
    const results = await searchGameIGDB(gameName);
    if (!results || results.length === 0) return null;

    const igdbId = results[0].id;

    // Fetch details + time-to-beat in parallel
    const [details, ttb] = await Promise.all([
      getGameDetailsIGDB(igdbId),
      getTimeToBeat(igdbId),
    ]);

    if (!details || details.length === 0) return null;

    const formatted = formatIGDBData(details[0]);

    // Merge time-to-beat into formatted data
    if (ttb) {
      const toHours = (secs) => secs && secs > 0 ? Math.round((secs / 3600) * 10) / 10 : null;
      formatted.timeToBeat = {
        mainStory:     toHours(ttb.hastily),
        mainExtra:     toHours(ttb.normally),
        completionist: toHours(ttb.completely),
      };
    }

    return formatted;
  } catch (error) {
    console.warn(`IGDB lookup failed for "${gameName}":`, error.message);
    return null;
  }
};

/**
 * Fetch full IGDB details by IGDB id directly — guaranteed match, no name search.
 * Use this when the home page came from IGDB (igdbId param in route).
 *
 * @param {number} igdbId - IGDB game id
 * @returns {Promise<object|null>} - Formatted IGDB game object or null
 */
export const fetchIGDBById = async (igdbId) => {
  try {
    const [details, ttb] = await Promise.all([
      getGameDetailsIGDB(igdbId),
      getTimeToBeat(igdbId),
    ]);
    if (!details || details.length === 0) return null;
    const formatted = formatIGDBData(details[0]);
    if (ttb) {
      const toHours = (secs) => secs && secs > 0 ? Math.round((secs / 3600) * 10) / 10 : null;
      formatted.timeToBeat = {
        mainStory:     toHours(ttb.hastily),
        mainExtra:     toHours(ttb.normally),
        completionist: toHours(ttb.completely),
      };
    }
    return formatted;
  } catch (error) {
    console.warn(`IGDB direct fetch failed for id ${igdbId}:`, error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE LISTINGS  (return { results, next } to match RAWG's shape)
// ─────────────────────────────────────────────────────────────────────────────

const IGDB_HOME_FIELDS = `
  fields id, name,
    cover.image_id, cover.url,
    screenshots.image_id, screenshots.url,
    total_rating, total_rating_count,
    first_release_date, hypes, category;
`;

const mapIGDBHomeGame = (g) => {
  const coverUrl = g.cover?.image_id
    ? igdbImageUrl(g.cover.image_id, 'cover_big')
    : g.cover?.url?.replace('t_thumb', 't_cover_big') || null;

  // Prefer first screenshot (landscape) for the card background image
  const screenshotUrl = g.screenshots?.[0]?.image_id
    ? igdbImageUrl(g.screenshots[0].image_id, 'screenshot_big')
    : g.screenshots?.[0]?.url?.replace('t_thumb', 't_screenshot_big') || null;

  return {
    id: g.id,
    name: g.name,
    background_image: screenshotUrl || coverUrl,  // same field GameCardItem reads
    coverImage: coverUrl,
    rating: g.total_rating ? Math.round(g.total_rating) / 10 : null,
    _source: 'igdb',  // flag so details page knows to use direct ID lookup
  };
};

/**
 * IGDB trending games (sorted by hype score — upcoming / anticipated).
 */
export const getIGDBTrending = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const sixMonthsAgo = Math.floor(Date.now() / 1000) - (6 * 30 * 24 * 3600);
  const cacheKey = `IGDB_TRENDING:${page}:${limit}`;
  const raw = await igdbRequest(
    'games',
    `${IGDB_HOME_FIELDS}
     where category = 0 & hypes > 0 & (first_release_date > ${sixMonthsAgo} | hypes > 10);
     sort hypes desc;
     limit ${limit};
     offset ${offset};`,
    cacheKey,
    2 * 60 * 60 * 1000 // 2h cache
  );
  const results = (raw || []).map(mapIGDBHomeGame);
  return { results, next: results.length === limit };
};

/**
 * IGDB popular games (sorted by rating count — most reviewed).
 */
export const getIGDBPopular = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const cacheKey = `IGDB_POPULAR:${page}:${limit}`;
  const raw = await igdbRequest(
    'games',
    `${IGDB_HOME_FIELDS}
     where category = 0 & total_rating_count > 20 & total_rating > 60;
     sort total_rating_count desc;
     limit ${limit};
     offset ${offset};`,
    cacheKey,
    4 * 60 * 60 * 1000 // 4h cache
  );
  const results = (raw || []).map(mapIGDBHomeGame);
  return { results, next: results.length === limit };
};

/**
 * IGDB new releases (most recently released main games).
 */
export const getIGDBNewReleases = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = `IGDB_NEW:${page}:${limit}`;
  const raw = await igdbRequest(
    'games',
    `${IGDB_HOME_FIELDS}
     where category = 0 & first_release_date <= ${now} & first_release_date > 0;
     sort first_release_date desc;
     limit ${limit};
     offset ${offset};`,
    cacheKey,
    2 * 60 * 60 * 1000 // 2h cache
  );
  const results = (raw || []).map(mapIGDBHomeGame);
  return { results, next: results.length === limit };
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert raw IGDB image_id to a full URL.
 * @param {string} imageId
 * @param {'cover_big'|'screenshot_big'|'screenshot_huge'|'thumb'} size
 */
export const igdbImageUrl = (imageId, size = 'cover_big') => {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
};

/** IGDB age rating category codes → human-readable labels */
const AGE_RATING_CATEGORY = { 1: 'ESRB', 2: 'PEGI' };

/** IGDB ESRB rating codes */
const ESRB_RATING = {
  6: 'RP', 7: 'EC', 8: 'E', 9: 'E10+', 10: 'T', 11: 'M', 12: 'AO',
};

/** IGDB PEGI rating codes */
const PEGI_RATING = {
  1: '3', 2: '7', 3: '12', 4: '16', 5: '18',
};

/** IGDB game status codes */
const GAME_STATUS = {
  0: 'Released', 2: 'Alpha', 3: 'Beta', 4: 'Early Access',
  5: 'Offline', 6: 'Cancelled', 7: 'Rumoured',
};

/**
 * Format raw IGDB game object into a clean, app-ready shape.
 * @param {object} raw - Raw IGDB game object
 * @returns {object} - Formatted game details
 */
export const formatIGDBData = (raw) => {
  if (!raw) return null;

  // Cover image
  const coverImageId = raw.cover?.image_id;
  const coverImage = coverImageId
    ? igdbImageUrl(coverImageId, 'cover_big')
    : raw.cover?.url?.replace('t_thumb', 't_cover_big') || null;

  // Screenshots
  const screenshots = (raw.screenshots || []).map(s =>
    s.image_id
      ? igdbImageUrl(s.image_id, 'screenshot_big')
      : s.url?.replace('t_thumb', 't_screenshot_big') || null
  ).filter(Boolean);

  // YouTube trailers
  const trailers = (raw.videos || []).map(v => ({
    id: v.video_id,
    name: v.name || 'Trailer',
    url: `https://www.youtube.com/watch?v=${v.video_id}`,
    thumbnail: `https://img.youtube.com/vi/${v.video_id}/hqdefault.jpg`,
  }));

  // Companies
  const developers = (raw.involved_companies || [])
    .filter(c => c.developer)
    .map(c => c.company?.name)
    .filter(Boolean);

  const publishers = (raw.involved_companies || [])
    .filter(c => c.publisher)
    .map(c => c.company?.name)
    .filter(Boolean);

  // Age ratings
  const ageRatings = (raw.age_ratings || []).map(r => ({
    system: AGE_RATING_CATEGORY[r.category] || 'Unknown',
    rating: r.category === 1
      ? (ESRB_RATING[r.rating] || 'NR')
      : (PEGI_RATING[r.rating] || 'NR'),
  }));

  const esrb = ageRatings.find(r => r.system === 'ESRB');
  const pegi = ageRatings.find(r => r.system === 'PEGI');

  // Similar games
  const similarGames = (raw.similar_games || []).slice(0, 10).map(g => ({
    id: g.id,
    name: g.name,
    coverImage: g.cover?.image_id
      ? igdbImageUrl(g.cover.image_id, 'cover_big')
      : g.cover?.url?.replace('t_thumb', 't_cover_big') || null,
    genres: (g.genres || []).map(genre => genre.name),
  }));

  // Release date
  const releaseDate = raw.first_release_date
    ? new Date(raw.first_release_date * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : 'TBA';

  return {
    igdbId: raw.id,
    name: raw.name,
    summary: raw.summary || '',
    storyline: raw.storyline || '',
    coverImage,
    screenshots,
    trailers,
    genres: (raw.genres || []).map(g => g.name),
    themes: (raw.themes || []).map(t => t.name),
    gameModes: (raw.game_modes || []).map(m => m.name),
    developers,
    publishers,
    platforms: (raw.platforms || []).map(p => ({
      name: p.name,
      abbreviation: p.abbreviation || p.name,
    })),
    ageRatings,
    esrb: esrb?.rating || 'NR',
    pegi: pegi?.rating || null,
    similarGames,
    releaseDate,
    status: GAME_STATUS[raw.status] ?? 'Released',
    totalRating: raw.total_rating ? Math.round(raw.total_rating) : null,
    totalRatingCount: raw.total_rating_count || 0,
    franchise: raw.franchise?.name || raw.franchises?.[0]?.name || null,
    collection: raw.collection?.name || null,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CACHE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/** Clear all IGDB cache entries from AsyncStorage */
export const clearIGDBCache = async () => {
  try {
    const removed = await clearCacheByPrefixes(['IGDB_']);
    console.log(`🗑️ Cleared ${removed} IGDB cache entries`);
  } catch (error) {
    console.error('IGDB cache clear error:', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default {
  searchGameIGDB,
  searchGamesIGDB,
  getGameDetailsIGDB,
  getTimeToBeat,
  fetchIGDBByName,
  formatIGDBData,
  igdbImageUrl,
  clearIGDBCache,
  checkIGDBHealth,
};
