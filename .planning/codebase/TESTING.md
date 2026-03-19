# Testing Patterns

**Analysis Date:** 2026-03-19

## Test Framework

**Runner:**
- No automated test runner is currently configured.
- `package.json` does not define `test` or `test:*` scripts.

**Assertion Library:**
- None configured in this repository.

**Run Commands:**
```bash
npm start            # Launch Expo app for manual testing
npm run android      # Run app on Android target
npm run ios          # Run app on iOS target
npm run web          # Run app on web target
```

## Test File Organization

**Location:**
- No dedicated test folders found (`tests/`, `__tests__/` absent).
- No test files discovered via `*test*` or `*spec*` filename search.

**Naming:**
- No naming standard for automated tests is currently established.

**Structure:**
```text
src/
  pages/             # Screen implementations
  components/        # Reusable UI pieces
  services/          # API/data services
  (no colocated test files present)
```

## Test Structure

**Suite Organization:**
- No existing suite structure (`describe/it`) found.

**Patterns:**
- Current validation is primarily manual:
  - screen-level interaction checks
  - service behavior observed through UI behavior and console logs
  - backend behavior verified via Supabase logs/data inspection

## Mocking

**Framework:**
- No mocking framework configured.

**Patterns:**
- No reusable mock factories or test doubles in repository.

**What to Mock (future baseline):**
- External APIs (`AniList`, `TMDB`, `RAWG`, `IGDB`, RSS feeds)
- Supabase client calls (`auth`, `from`, `storage`)
- AsyncStorage cache reads/writes

## Fixtures and Factories

**Test Data:**
- No centralized fixtures/factories directory found.
- Sample data shaping currently occurs inline within service formatters and page utilities.

**Location:**
- N/A (not established yet).

## Coverage

**Requirements:**
- No coverage target currently enforced.

**Configuration:**
- No coverage tooling configuration found.

**View Coverage:**
```bash
# Not available (coverage tooling not configured)
```

## Test Types

**Unit Tests:**
- Not implemented.

**Integration Tests:**
- Not implemented.

**E2E Tests:**
- Not implemented.

## Common Patterns

**Current verification approach:**
- Manual smoke checks through navigation flows in Expo runtime.
- Manual auth/profile/review checks against Supabase data.
- Runtime console inspection for request/cache/error behavior.

**High-risk areas currently lacking automated tests:**
- `src/services/requestPolicy.js` retry/dedupe behavior
- `src/services/reviewService.js` like toggling + race handling
- `src/services/search.js` media-type dispatch/fallback behavior
- `src/pages/details_anime.jsx` complex state/side-effect rendering flow

---
*Testing analysis: 2026-03-19*
*Update when test patterns change*
