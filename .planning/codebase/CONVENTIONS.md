# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**
- Route/screen files in `src/pages/` use snake_case (for example `details_anime.jsx`, `post_detail_anime.jsx`).
- React component files in `src/components/` are typically PascalCase (for example `GlassCard.jsx`, `SkeletonHome.jsx`).
- Service files are lower-case and mixed style (`api_tmdb.js`, `reviewService.js`, `mediaStatusService.js`).

**Functions:**
- Function names are camelCase for both sync/async methods (`getAnimeDetails`, `setMediaStatus`, `searchMedia`).
- Async functions do not use a naming prefix; async behavior is inferred from `async`.
- Event handlers generally use `handleX` names in UI files (`handleLogin`, `handleSignUp`, `handleWishlistToggle`).

**Variables:**
- Local state/variables use camelCase.
- Constants are frequently UPPER_SNAKE_CASE in service modules (`RAWG_API_URL`, `CACHE_DURATION`).
- Map/collection constants use descriptive upper-case identifiers (`HOME_COMPONENTS`, `GENRE_MAP`).

**Types:**
- No app-wide TypeScript type layer in `src/`; code is primarily JavaScript.
- TypeScript is used in Supabase edge function only (`supabase/functions/igdb-proxy/index.ts`).

## Code Style

**Formatting:**
- Semicolons are consistently used.
- Single quotes dominate in services and many components; double quotes also appear in some screen files.
- 2-space indentation is common.
- File-level section banners with comment blocks are heavily used in service modules.

**Linting:**
- No ESLint config detected (`eslint.config.*` / `.eslintrc*` absent).
- No lint script defined in `package.json`.

## Import Organization

**Order (observed pattern):**
1. External packages (`react`, `react-native`, `axios`, SDKs).
2. Internal modules/components.
3. Relative sibling imports.

**Grouping:**
- Most files keep imports grouped at the top with blank lines between conceptual groups.
- Sorting is not strictly alphabetical; order is usually by usage context.

**Path Aliases:**
- No path alias usage detected; relative imports are standard (`../`, `./`).

## Error Handling

**Patterns:**
- Services commonly wrap external calls in `try/catch`, log error, and return `{ success: false, error }`.
- Some API adapters throw after logging (`api_anilist.js`, `api_tmdb.js`, `api_rawg.js`) while higher-level callers handle fallback behavior.
- UI screens often provide local fallback states (loading/error/retry) around async calls.

**Error Types:**
- Expected failures are usually returned as result objects rather than custom error classes.
- `Error` objects are thrown for invalid preconditions in core helpers (`runRequestWithPolicy`).

## Logging

**Framework:**
- `console.log`, `console.warn`, and `console.error` are used directly.
- No centralized logger abstraction found.

**Patterns:**
- API/cache operations log cache hits/misses and request errors in service modules.
- UI flows log operational errors (for example, image upload or fetch failures).

## Comments

**When to Comment:**
- Heavy usage of section dividers and header banners in API/service files.
- Inline comments explain integration setup, cache behavior, and fallback logic.
- UI comments often annotate state blocks and interaction intent.

**JSDoc/TSDoc:**
- Many service functions include JSDoc-style comments with params/returns.
- Not universally enforced, but common in service modules.

**TODO Comments:**
- Existing TODOs are in active source, for example:
  - `src/services/search.js` (comic/manga search implementation pending)
  - `src/stylehandler/postPageStyles.js` and `src/stylehandler/postDetailStyles.js` (route TODOs)

## Function Design

**Size:**
- Service functions are usually focused and short-to-medium.
- Some screen files are very large and combine rendering, formatting, and side effects (`src/pages/details_anime.jsx`).

**Parameters:**
- Simple positional parameters are common in service functions.
- Object parameters are used selectively (`runRequestWithPolicy`, selected callbacks).

**Return Values:**
- Mixed conventions:
  - Raw payload returns for API adapters.
  - `{ success, data/error }` envelopes for Supabase/business services.

## Module Design

**Exports:**
- Named exports are common for individual functions.
- Many files also provide a default export object aggregating named functions.
- React component files use default exports.

**Barrel Files:**
- No major barrel-export pattern observed.
- Imports generally target concrete file paths directly.

---
*Convention analysis: 2026-03-19*
*Update when patterns change*
