# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**Anime Catalog API:**
- AniList GraphQL (`https://graphql.anilist.co`) - anime discovery/details/search
  - Integration method: GraphQL POST via `axios` in `src/services/api_anilist.js`
  - Auth: none required in current implementation
  - Usage: home feeds, search, detail pages

**Movie Catalog API:**
- TMDB (`https://api.themoviedb.org/3`) - movie lists/search/details
  - Integration method: REST via `axios` in `src/services/api_tmdb.js`
  - Auth: `EXPO_PUBLIC_TMDB_API_KEY` (client-side env var)
  - Caching: AsyncStorage-based cache keys (`TMDB_*`)

**Game Catalog API:**
- RAWG (`https://api.rawg.io/api`) - game lists/search/details
  - Integration method: REST via `axios` in `src/services/api_rawg.js`
  - Auth: `EXPO_PUBLIC_RAWG_API_KEY` (client-side env var)
  - Caching: AsyncStorage-based cache keys (`TRENDING`, `POPULAR`, etc.)

**Game Metadata API (deep details):**
- IGDB (`https://api.igdb.com/v4`) - rich game detail model
  - Integration method: REST POST (Apicalypse) via `fetch` in `src/services/api_igdb.js`
  - Auth: user-supplied client ID/token from AsyncStorage (`getIGDBCredentials` in `src/services/settings.js`)
  - Related server-side path: Supabase Edge proxy in `supabase/functions/igdb-proxy/index.ts`

**News Sources (RSS):**
- Anime Corner (`https://animecorner.me/feed/`) via `src/services/news_service.js`
- Variety / Hollywood Reporter / Collider feeds via `src/services/news_movies.js`
- Insider Gaming feed via `src/services/news_games.js`
  - Integration method: RSS fetch + regex parsing using `axios`

## Data Storage

**Databases:**
- Supabase Postgres - primary relational data store
  - Tables/migrations: `supabase/migrations/*.sql`
  - Access client: `@supabase/supabase-js` in `src/services/supabase.js`
  - Core entities in active code: `profiles`, `reviews`, `review_likes`, `user_media_status`, `posts`

**File Storage:**
- Supabase Storage bucket `avatars`
  - Upload path: `avatars/<userId>-<timestamp>.<ext>` in `src/components/profile_page/EditProfileModal.jsx`
  - Public URL retrieval via `supabase.storage.from('avatars').getPublicUrl(...)`

**Caching / Local State Persistence:**
- AsyncStorage for:
  - API caches (`src/services/api_tmdb.js`, `src/services/api_rawg.js`, `src/services/api_igdb.js`, news services)
  - App settings and IGDB credentials (`src/services/settings.js`)
  - Supabase auth session persistence (`src/services/supabase.js`)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Email/password login/signup (`src/services/auth.js`)
  - OAuth provider methods wired: Google, Apple, Facebook (`src/services/auth.js`)
  - Session persistence: AsyncStorage-backed session storage (`src/services/supabase.js`)

**Profile Bootstrap:**
- DB trigger creates profile row on new auth user
  - SQL trigger/function in `supabase/supabase_setup.sql` and related migration scripts

## Monitoring & Observability

**Error Tracking:**
- No dedicated external error tracking (Sentry/Crashlytics/etc.) detected
- Current approach: `console.error` and `console.warn` in services and screens

**Analytics:**
- No external analytics SDK detected in `package.json` or `src/services/`

**Logs:**
- Client-side console logs only
- Supabase function logs via Deno runtime (if function is deployed)

## CI/CD & Deployment

**Hosting / Runtime Targets:**
- Mobile app deployment target via Expo/EAS (`eas.json`)
- Backend services hosted on Supabase (Postgres/Auth/Storage/Edge Functions)

**CI Pipeline:**
- No `.github/workflows` directory detected
- No CI scripts defined in `package.json`

## Environment Configuration

**Development:**
- Required env vars in `.env.example`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_RAWG_API_KEY`
- TMDB env usage exists in `src/services/api_tmdb.js`

**Supabase Edge Function Secrets (server-side):**
- `IGDB_TWITCH_CLIENT_ID`
- `IGDB_TWITCH_CLIENT_SECRET`
- Read via `Deno.env.get(...)` in `supabase/functions/igdb-proxy/index.ts`

**Production:**
- Sensitive server-side secrets intended for Supabase secret store (not client env)
- Client-side `EXPO_PUBLIC_*` vars are visible to app bundles

## Webhooks & Callbacks

**Incoming:**
- No external webhook handlers found in app code
- Supabase auth trigger used for profile creation (DB-level, not HTTP webhook)

**Outgoing:**
- Standard outgoing HTTP requests to external APIs/news feeds
- No callback retry queue or webhook delivery layer detected

---
*Integration audit: 2026-03-19*
*Update when adding/removing external services*
