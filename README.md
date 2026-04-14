# AfterCredits

AfterCredits is an Expo + React Native entertainment tracker with three active verticals:
- Anime
- Movies
- Games

Comics and Manga entries exist in navigation/settings but are intentionally locked as coming soon.

## What The App Includes

- Multi-tab experience (`Home`, `Post`, `Discover`, `Podium`) with a custom animated bottom nav.
- Dynamic Home tab that switches by selected media type.
- Rich detail pages:
  - Anime details (relations-based season section, cast/VA, reviews, related shows)
  - Movie details (TMDB details, cast, trailers, recommendations)
  - Game details (IGDB-enriched details, progress, DLC tracking, screenshots, user media)
- Unified search service per media type.
- Supabase-backed auth, profile, statuses, wishlist, and reviews.
- RSS-driven news (anime/games/movies services).
- Local caching (AsyncStorage) with namespace budgets + periodic cleanup.
- Reusable theme + font system with media-specific styling.

## Tech Stack

- Expo SDK 54
- React 19 + React Native 0.81
- React Navigation (stack + material top tabs)
- Reanimated + Gesture Handler
- Supabase (`@supabase/supabase-js`)
- AsyncStorage
- Skia + FlashList
- Icon libraries:
  - `iconoir-react-native` (used for Home/Post tab icons)
  - `@expo/vector-icons` / Ionicons (used across app)

## Project Structure

```text
AfterCredits/
  App.js
  src/
    pages/                # Screen-level UI
    components/           # Reusable UI components
    services/             # API + data + storage services
    hooks/                # Screen data hooks (e.g. anime details hook)
    context/              # Media type + pager swipe context
    stores/               # Zustand stores (profile)
    stylehandler/         # Per-page themed style builders
    utils/                # Themes, responsive helpers, misc helpers
  assets/
    font/                 # Custom fonts (Agdasima, Genjiro, etc.)
  scripts/
    seed_game_awards_posts.mjs
```

## Licensing

- [EULA](./EULA.md)
- [Source License](./LICENSE.md)

The current repository license is proprietary / all rights reserved unless you replace it with another license before distribution.

## Navigation Overview

- `MainTabs` uses material top tabs positioned at bottom with custom `NavBar`.
- Tabs:
  - `Home`
  - `PostPage`
  - `DiscoverPage`
  - `PodiumPage`
- Stack screens include:
  - `DetailsAnime`, `DetailsMovies`, `DetailsGames`
  - `ReviewAnime` (shared review page by media type)
  - `CrewDetailPage`, `GameStatPage`
  - `UpcomingPage`, `NewsPage`, `PostDetailAnime`, `ProfilePage`, `AuthPage`, `PodiumListPage`

## Data Sources

- Anime: AniList GraphQL
  - `src/services/api_anilist.js`
- Movies: TMDB REST
  - `src/services/api_tmdb.js`
- Games:
  - RAWG for list/discover/upcoming and lightweight data (`api_rawg.js`)
  - IGDB for rich details/search/high-fidelity game metadata (`api_igdb.js`)
- News:
  - Anime: Anime Corner feed
  - Games: Insider Gaming feed
  - Movies: Variety / THR / Collider fallback chain

## Environment Variables

Create `.env` in the project root.

Required:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_RAWG_API_KEY=...
```

Also used by code:

```bash
# Required for movie API features:
EXPO_PUBLIC_TMDB_API_KEY=...

# Optional fallback for IGDB credentials if not entered in-app:
EXPO_PUBLIC_IGDB_CLIENT_ID=...
EXPO_PUBLIC_IGDB_ACCESS_TOKEN=...
```

Notes:
- IGDB credentials are primarily entered in-app via `Profile -> IGDB API`.
- `.npmrc` already sets `legacy-peer-deps=true` to avoid peer conflicts (notably `iconoir-react-native` with React 19).

## Install & Run

```bash
npm install
npm run start
```

Common commands:

```bash
npm run android
npm run ios
npm run web
npm run test:rss
```

Android release build (existing workflow used in this repo):

```powershell
.\android\gradlew.bat assembleRelease --project-dir android
```

## Supabase Requirements

The app expects these main tables (based on current services):

- `profiles`
- `posts`
- `reviews`
- `review_likes`
- `user_media_status`
- `user_game_status_details`

Related service files:
- `src/services/auth.js`
- `src/services/profile.js`
- `src/services/postService.js`
- `src/services/reviewService.js`
- `src/services/mediaStatusService.js`

## Caching & Request Policy

### Request dedupe + retry
- `src/services/requestPolicy.js`
- In-flight dedupe by key.
- Retries transient failures (`429`, `5xx`, and network timeout-style errors) with exponential backoff + jitter.

### AsyncStorage cache manager
- `src/services/cacheManager.js`
- Namespaced budgets + global budget:
  - `TMDB`: 6 MB / 220 entries
  - `RAWG`: 7 MB / 260 entries
  - `IGDB`: 8 MB / 260 entries
  - `NEWS`: 2 MB / 50 entries
  - Global cap: 20 MB
- Sweep job runs at app startup and then periodically (default every 15 minutes).

### Anime season-chain cache (in-memory)
- `src/services/api_anilist.js`
- Has a dedicated in-memory cache with:
  - max entries: 80
  - TTL: 30 minutes
- Current implementation of `getAnimeSeasonChain(...)` intentionally returns only the requested season node (no deep traversal).

## Font System

Loaded in `src/utils/mediaThemes.js`:
- `Abroad-Bold`
- `Agdasima`
- `Agdasima-Bold`
- `Genjiro`
- `NinjaNaruto`
- `Blackbots`

Initialized at app boot in `App.js` via:
- `initializeFonts()`
- `useMediaFonts()`

## Key Feature Modules

- Search:
  - `src/services/search.js`
  - Unified API with IGDB-specific relevance ranking for games.
- Status + wishlist:
  - `src/services/mediaStatusService.js`
  - Shared media status table + game-specific detail table.
- Reviews:
  - `src/services/reviewService.js`
  - Media-type alias handling (`movie/movies`, `game/games`) to tolerate DB naming variation.
- Profile + settings:
  - `src/pages/profile_page.jsx`
  - Includes sidebar visibility/reordering and IGDB credential management.

## Known Limitations (Current Code State)

- Comics and Manga are placeholders and locked off in settings logic.
- OAuth social buttons are currently hidden in auth UI (email/password is active path).
- `NewsPage` currently fetches anime or games feeds only; movies news service exists and is used in Discover but not wired into `NewsPage` yet.
- Anime season section currently relies on detail relations + current-season behavior; deep full-chain traversal is not active in the hook path.
- `EXPO_PUBLIC_TMDB_API_KEY` is required by code but not listed in `.env.example` yet.

## Useful Docs In Repo

- `SUPABASE_SETUP.md`
- `OAUTH_SETUP.md`
- `DATABASE_SCHEMA.md`

## One-off Utility Script

- `scripts/seed_game_awards_posts.mjs`
  - Seeds `posts` table with curated game-awards entries.
  - Requires `.env` with Supabase + RAWG keys.
