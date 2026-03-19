# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```
AfterCredits/
├── .codex/                    # GSD workflows, templates, and command skills
├── .agents/                   # Agent skill assets/instructions
├── android/                   # Native Android project artifacts
├── assets/                    # Static assets (icons, splash, fonts)
├── dist/                      # Build output / generated artifacts
├── reference/                 # Design/reference files and imported skill examples
├── src/                       # Application source code
│   ├── components/            # Reusable UI components by feature/shared groups
│   ├── context/               # React context providers
│   ├── pages/                 # Route/screen-level components
│   ├── services/              # API, Supabase, and settings/data services
│   ├── stores/                # Zustand stores
│   ├── stylehandler/          # Shared style objects/constants
│   └── utils/                 # Utility helpers
├── supabase/                  # SQL setup/migrations and edge functions
│   ├── functions/             # Supabase Edge Functions
│   └── migrations/            # Schema/data migration files
├── App.js                     # App composition + navigation entry
├── index.js                   # Expo root registration entry
├── package.json               # Dependency and script manifest
├── app.json                   # Expo app configuration
└── eas.json                   # EAS build profile configuration
```

## Directory Purposes

**src/pages/**
- Purpose: Screen-level route implementations.
- Contains: `home_*`, `details_*`, `auth_page`, `profile_page`, `post_*`, `news_page`, `podium_*`, `discover_page`.
- Key files: `src/pages/home_screen.jsx`, `src/pages/details_anime.jsx`, `src/pages/auth_page.jsx`.
- Subdirectories: none (flat file organization).

**src/components/**
- Purpose: Reusable presentational and feature-scoped UI pieces.
- Contains: feature folders (`home_page`, `details_page`, `profile_page`, `podium_page`, `discover_page`, `review_page`) plus `shared` and `skeletons`.
- Key files: `src/components/home_page/NavBar.jsx`, `src/components/shared/GlassCard.jsx`.

**src/services/**
- Purpose: External API and Supabase access, business logic helpers.
- Contains: provider-specific API clients (`api_anilist.js`, `api_tmdb.js`, `api_rawg.js`, `api_igdb.js`), auth/profile/review/status services, request policy.
- Key files: `src/services/supabase.js`, `src/services/auth.js`, `src/services/reviewService.js`, `src/services/requestPolicy.js`.

**supabase/**
- Purpose: Backend schema definitions and server-side function code.
- Contains: setup scripts and incremental migration files; edge function code.
- Key files: `supabase/supabase_setup.sql`, `supabase/migrations/001_reviews_schema.sql`, `supabase/functions/igdb-proxy/index.ts`.

**assets/**
- Purpose: App static media and custom fonts.
- Contains: app icon/splash assets and font files.
- Key files: `assets/font/Genjiro.ttf`, `assets/font/Agdasima-Regular.ttf`.

## Key File Locations

**Entry Points:**
- `index.js`: Expo root registration.
- `App.js`: main providers, tab/stack navigator definitions.

**Configuration:**
- `package.json`: dependencies and run scripts.
- `app.json`: Expo app metadata/config.
- `eas.json`: EAS build settings.
- `tsconfig.json`: TypeScript tooling baseline.
- `.env.example`: documented client env variables.

**Core Logic:**
- `src/services/`: network/database and caching logic.
- `src/pages/`: feature orchestration and route state handling.
- `src/context/MediaTypeContext.js`: current media-type global context.
- `src/stores/useProfileStore.js`: cached profile state store.

**Testing:**
- No dedicated test directory found (`tests/`, `__tests__/`, or `*.test.*` absent).

**Documentation:**
- `DATABASE_SCHEMA.md`, `SUPABASE_SETUP.md`, `OAUTH_SETUP.md` for backend setup notes.
- `.codex/get-shit-done/` for workflow/template documentation.

## Naming Conventions

**Files:**
- Page files: snake_case style in `src/pages/` (for example `details_anime.jsx`, `home_game.jsx`).
- Components: PascalCase in feature folders (for example `NavBar.jsx`, `ReviewCard.jsx`, `EditProfileModal.jsx`).
- Services: mostly lowercase with underscores for provider names (for example `api_tmdb.js`, `news_movies.js`, `reviewService.js`).

**Directories:**
- Feature-first grouping under `src/components/` and `src/pages/`.
- Lowercase directory names with underscores where needed (`stylehandler`, `home_page`).

**Special Patterns:**
- Service modules export both named functions and default aggregate exports.
- SQL migrations use numeric prefixes for ordering (`001_...sql` to `010_...sql`).

## Where to Add New Code

**New Feature Screen:**
- Primary code: `src/pages/`
- Shared UI blocks: `src/components/<feature>/`
- Data access: `src/services/`

**New API Integration:**
- Service adapter: `src/services/` (new `api_<provider>.js` or domain-specific service)
- Environment docs: `.env.example` and setup markdown docs

**New Supabase Data Feature:**
- SQL migration: `supabase/migrations/`
- Client access logic: `src/services/`
- Related route UI: `src/pages/` + `src/components/`

**Shared Utilities/State:**
- Utility helpers: `src/utils/`
- Global state/context: `src/stores/` or `src/context/`

## Special Directories

**dist/**
- Purpose: build/generated output.
- Source: generated by tooling/build process.
- Committed: currently present in repo; verify policy before relying on contents.

**.expo/**
- Purpose: local Expo dev state.
- Source: generated by Expo during development.
- Committed: no (ignored in `.gitignore`).

**android/**
- Purpose: native Android project files for Expo prebuild/run workflows.
- Source: generated/maintained native project.
- Committed: currently present in repo.

---
*Structure analysis: 2026-03-19*
*Update when directory structure changes*
