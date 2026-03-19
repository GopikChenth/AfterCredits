# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Client-heavy React Native application with a service-layer API boundary and Supabase-backed data/auth.

**Key Characteristics:**
- Single Expo app entry (`index.js` -> `App.js`) with stack + tab navigation.
- Feature screens in `src/pages/` orchestrate UI state and service calls.
- Service modules in `src/services/` encapsulate remote APIs, Supabase CRUD, and retry/caching helpers.
- Mixed backend model: direct third-party API calls from client + Supabase-managed data/auth/storage.

## Layers

**App Shell / Navigation Layer:**
- Purpose: Bootstrap providers, fonts, and route graph.
- Contains: `App.js`, `index.js`, navigation setup (`createNativeStackNavigator`, `createMaterialTopTabNavigator`)
- Depends on: Context layer and screen layer
- Used by: All runtime app flows

**Screen Layer:**
- Purpose: Route-level composition, loading/error UX, user interactions.
- Contains: `src/pages/*.jsx` (for example `src/pages/home_screen.jsx`, `src/pages/details_anime.jsx`, `src/pages/auth_page.jsx`)
- Depends on: Components + services + shared utils
- Used by: Navigation routes

**Component Layer:**
- Purpose: Reusable UI blocks and visual primitives.
- Contains: `src/components/home_page/*`, `src/components/details_page/*`, `src/components/shared/*`, skeleton components
- Depends on: style handlers and utility/theme helpers
- Used by: Screen layer

**Service/Data Layer:**
- Purpose: Data access, request policies, caching, data formatting, Supabase operations.
- Contains: `src/services/*.js` (AniList/TMDB/RAWG/IGDB/news/auth/profile/reviews/media status)
- Depends on: network APIs, Supabase SDK, AsyncStorage
- Used by: Screen layer and selected components

**Backend/External Layer:**
- Purpose: Persistence and external content providers.
- Contains: Supabase SQL schema/migrations in `supabase/`, edge function in `supabase/functions/igdb-proxy/index.ts`
- Depends on: Supabase platform + third-party APIs
- Used by: Service layer

## Data Flow

**App Startup + Navigation Flow:**
1. `index.js` registers root component.
2. `App.js` initializes fonts and wraps app in `SafeAreaProvider`, `MediaTypeProvider`, and `NavigationContainer`.
3. Stack navigator loads `MainTabs`, and tabs render route-level pages.
4. Tab and stack interactions dispatch users into specific feature screens.

**Media Detail Flow (anime example):**
1. Screen receives route params (`animeId`) in `src/pages/details_anime.jsx`.
2. Screen requests external metadata (`getAnimeDetails` from `src/services/api_anilist.js`).
3. Screen requests user-specific status/reviews via Supabase services:
   - `getMediaStatus` from `src/services/mediaStatusService.js`
   - `getMediaReviews` and `getMediaReviewStats` from `src/services/reviewService.js`
4. Screen merges API + DB data into local component state and renders components.
5. User actions (wishlist/status/reviews/likes) write back through service functions.

**Search Flow:**
1. UI invokes `searchMedia` in `src/services/search.js`.
2. Switch dispatches to per-domain API module (`api_anilist`, `api_tmdb`, `api_igdb`).
3. Result normalization maps data into a common shape.
4. UI renders cards/results sorted by popularity.

**State Management:**
- Local route state via React hooks (`useState`, `useEffect`, `useFocusEffect`)
- Global media context via `src/context/MediaTypeContext.js`
- Shared profile cache via Zustand store in `src/stores/useProfileStore.js`
- Persistent cache/settings/session state via AsyncStorage

## Key Abstractions

**Service Module Boundary:**
- Purpose: Keep request logic out of screens/components
- Examples: `src/services/api_anilist.js`, `src/services/reviewService.js`, `src/services/auth.js`
- Pattern: Functions return either raw API payloads or `{ success, data|error }` envelopes

**Request Policy Wrapper:**
- Purpose: Retry and dedupe transient network failures
- Example: `runRequestWithPolicy` in `src/services/requestPolicy.js`
- Pattern: caller passes `dedupeKey`, request callback, retry policy options

**Theme/Media Mapping:**
- Purpose: Media-type dependent visuals and behaviors
- Examples: `src/utils/mediaThemes.js`, `src/pages/home_screen.jsx`
- Pattern: dictionary mapping + context-driven switching

## Entry Points

**Mobile App Entry:**
- Location: `index.js`
- Triggers: Expo runtime startup
- Responsibilities: register root app component

**Application Composition Entry:**
- Location: `App.js`
- Triggers: app mount
- Responsibilities: providers, navigation graph, font readiness gate

**Edge Function Entry (optional backend helper):**
- Location: `supabase/functions/igdb-proxy/index.ts`
- Triggers: HTTP requests to Supabase function endpoint
- Responsibilities: server-side Twitch token generation + allowed IGDB proxy endpoints

## Error Handling

**Strategy:** Localized try/catch blocks with console logging and fallback return values.

**Patterns:**
- Services often return `{ success: false, error: error.message }` instead of throwing upstream.
- Screen components frequently show retry UIs after service call failures (`src/pages/details_anime.jsx`).
- API adapters use retry policy wrapper for transient HTTP failures.

## Cross-Cutting Concerns

**Caching:**
- AsyncStorage cache wrappers in API services (`src/services/api_tmdb.js`, `src/services/api_rawg.js`, `src/services/api_igdb.js`, news services)

**Auth:**
- Supabase auth session persistence in `src/services/supabase.js`
- Auth flows encapsulated in `src/services/auth.js`

**Validation:**
- Input checks mostly in UI/service functions (for example `src/pages/auth_page.jsx`, `src/services/search.js`)
- Database-level constraints and RLS in Supabase SQL migrations

**Observability:**
- No centralized telemetry service detected; console logs are primary diagnostics path

---
*Architecture analysis: 2026-03-19*
*Update when major patterns change*
