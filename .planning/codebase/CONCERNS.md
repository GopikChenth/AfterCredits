# Codebase Concerns

**Analysis Date:** 2026-03-19

## Tech Debt

**IGDB integration path split between client and server approaches:**
- Issue: Client service `src/services/api_igdb.js` calls IGDB directly with user credentials, while repository also includes server proxy `supabase/functions/igdb-proxy/index.ts`.
- Why: Integration appears to have evolved from direct client auth to server-proxy model.
- Impact: Operational confusion, duplicated auth paths, and inconsistent secret-handling model.
- Fix approach: Pick one canonical IGDB architecture, remove the other path, and align setup docs/env keys.

**Manual RSS parsing duplicated across multiple services:**
- Issue: Regex-heavy XML parsing repeated in `src/services/news_service.js`, `src/services/news_movies.js`, `src/services/news_games.js`.
- Why: Separate source implementations built independently.
- Impact: Bug fixes and parser improvements must be duplicated; malformed feeds can break parsing silently.
- Fix approach: Extract shared RSS parser utility with source-specific adapters and add parser regression tests.

**Large, mixed-responsibility screen files:**
- Issue: Some screens combine data fetching, transformation, and large style blocks (for example `src/pages/details_anime.jsx`).
- Why: Feature growth concentrated inside route files.
- Impact: Harder to reason about behavior, riskier edits, slower onboarding for contributors.
- Fix approach: Split into hooks (`useAnimeDetailsData`), presentational subcomponents, and isolated style modules.

## Known Bugs

**Undefined state references in unused action renderer (anime details):**
- Symptoms: `renderActionButtons` references `isWatched` / `setIsWatched` without definitions.
- Trigger: If function is wired into render flow in future edits, runtime exception will occur.
- File: `src/pages/details_anime.jsx` (around lines reported by search for `isWatched`).
- Workaround: Function currently appears unused.
- Root cause: Legacy code path not removed after status model changes.

**Search for comics/manga is not implemented:**
- Symptoms: comic/manga search returns empty arrays and logs TODO messages.
- Trigger: User searches with media type `comic` or `manga`.
- File: `src/services/search.js`.
- Workaround: none besides avoiding those media types.
- Root cause: integration adapters were never added for these domains.

## Security Considerations

**Public client env exposure for third-party API keys:**
- Risk: `EXPO_PUBLIC_*` keys are bundled into client builds (`src/services/api_tmdb.js`, `src/services/api_rawg.js`, `src/services/supabase.js`).
- Current mitigation: using anon/public-scoped keys by design.
- Recommendations: keep sensitive secrets server-side where possible, and tighten provider-side key restrictions/rate limits.

**User-managed IGDB credentials stored in AsyncStorage:**
- Risk: IGDB client ID/token are persisted on device via `src/services/settings.js`.
- Current mitigation: none beyond local app storage behavior.
- Recommendations: migrate IGDB auth to server-side edge function only; avoid long-lived third-party tokens on client.

**Avatar upload validation is lightweight:**
- Risk: upload type derives from file extension in `src/components/profile_page/EditProfileModal.jsx`.
- Current mitigation: MIME assignment and Supabase bucket usage.
- Recommendations: enforce MIME/content validation and size checks both client-side and in storage policy rules.

## Performance Bottlenecks

**Heavy detail screen data and render path:**
- Problem: `src/pages/details_anime.jsx` performs multiple network/database calls plus extensive transformation and rendering in one component.
- Measurement: no quantified p95 metrics currently tracked.
- Cause: screen-level orchestration without dedicated data-layer memoization boundaries.
- Improvement path: split data hooks, memoize derived lists, and defer non-critical sections.

**Cache growth without central eviction policy:**
- Problem: many AsyncStorage cache key spaces (`TMDB_*`, `RAWG_*`, `IGDB_*`, `NEWS_CACHE:*`) are written independently.
- Measurement: cache size not currently monitored.
- Cause: per-service cache implementations with no global budget/cleanup strategy.
- Improvement path: add centralized cache manager with size-aware pruning and stale sweep job.

## Fragile Areas

**SQL migration history includes destructive reset scripts:**
- Why fragile: both incremental migrations and full reset scripts exist (`supabase/supabase_drop_and_recreate.sql`, setup files, and migration chain).
- Common failures: accidental use of destructive script in wrong environment, schema drift across environments.
- Safe modification: enforce migration-only production path and clearly separate local reset scripts.
- Test coverage: no migration test automation detected.

**Mixed return conventions in services:**
- Why fragile: some modules throw (`api_*`), others return `{ success: false }` envelopes.
- Common failures: callers mishandle failure paths due to inconsistent contract expectations.
- Safe modification: standardize service contract shape and centralize error adapter behavior.
- Test coverage: no automated contract tests found.

## Scaling Limits

**Direct client consumption of third-party APIs:**
- Current capacity: bounded by provider rate limits and client network conditions.
- Limit: high active users may trigger key-level throttling.
- Symptoms at limit: API failures, degraded feeds/search, retry storms.
- Scaling path: move high-volume aggregation to backend proxy/caching layer.

## Dependencies at Risk

**External RSS feed dependencies with no fallback cache beyond short TTL:**
- Risk: source feed format changes or temporary outages can break news ingestion.
- Impact: empty/failed news surfaces in app.
- Migration plan: add feed health checks, resilient parser fallback, and multi-source normalization tests.

## Missing Critical Features

**Automated test and CI pipeline:**
- Problem: no unit/integration/E2E suite and no CI workflows.
- Current workaround: manual testing in Expo and ad-hoc verification.
- Blocks: safe refactoring, fast regression detection, confidence in schema/service changes.
- Implementation complexity: medium (testing stack + CI setup).

**Comics and manga search/data path completion:**
- Problem: placeholders remain in `src/services/search.js`.
- Current workaround: hide/avoid unsupported media flows.
- Blocks: complete multi-media promise of app.
- Implementation complexity: medium (provider integration + UI support + schema implications).

## Test Coverage Gaps

**Networking and retry policy:**
- What's not tested: transient retry + request dedupe logic in `src/services/requestPolicy.js`.
- Risk: duplicate requests or failed retry behavior under flaky networks.
- Priority: High.
- Difficulty to test: Low-to-medium with mocked timers/network.

**Supabase write flows and race windows:**
- What's not tested: review like toggling and status/wishlist upsert/delete behavior (`src/services/reviewService.js`, `src/services/mediaStatusService.js`).
- Risk: inconsistent counts/state during concurrent user actions.
- Priority: High.
- Difficulty to test: Medium (requires Supabase client mocking or integration test environment).

---
*Concerns audit: 2026-03-19*
*Update as issues are fixed or new ones discovered*
