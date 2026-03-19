# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- JavaScript (ES modules) - Application logic in `App.js`, `index.js`, and most files under `src/`
- JSX - React Native UI in `src/pages/*.jsx` and `src/components/**/*.jsx`
- SQL - Supabase schema/migrations in `supabase/*.sql` and `supabase/migrations/*.sql`

**Secondary:**
- TypeScript - Supabase Edge Function in `supabase/functions/igdb-proxy/index.ts`
- JSON - Project and build config in `package.json`, `app.json`, `eas.json`, `tsconfig.json`

## Runtime

**Environment:**
- React Native app runtime via Expo SDK 54 (`expo` dependency in `package.json`)
- React 19 + React Native 0.81 (`react`, `react-native` in `package.json`)
- Deno runtime for Supabase Edge Functions (`supabase/functions/igdb-proxy/index.ts`)

**Package Manager:**
- npm (lockfile present at `package-lock.json`)
- Scripts defined in `package.json`: `start`, `android`, `ios`, `web`

## Frameworks

**Core:**
- Expo - app runtime/build tooling (`expo`, `expo-*` packages)
- React Native - mobile UI framework
- React Navigation - routing/navigation (`@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/material-top-tabs`)
- Supabase JS client - auth/data/storage client (`@supabase/supabase-js`)

**Testing:**
- No test framework configured in `package.json` scripts
- No test config files (`jest.config.*`, `vitest.config.*`) found in repo root

**Build/Dev:**
- Expo CLI workflows (`expo start`, `expo run:*`)
- EAS build config in `eas.json`
- TypeScript compiler dependency present for tooling (`typescript` in `devDependencies`)

## Key Dependencies

**Critical:**
- `expo` - app platform runtime and bundling
- `@react-navigation/native` + stack/tab packages - app navigation model
- `@supabase/supabase-js` - authentication, database, storage, and session handling
- `axios` - HTTP client for AniList/TMDB/RAWG/news services
- `@react-native-async-storage/async-storage` - local persistence for cache/settings/session helpers
- `zustand` - lightweight client state store (`src/stores/useProfileStore.js`)

**Infrastructure:**
- `react-native-gesture-handler`, `react-native-reanimated`, `react-native-pager-view` - gesture and tab interactions
- `expo-image` and `expo-image-picker` - media loading and user image uploads
- `@shopify/react-native-skia` and `react-native-svg` - custom visuals/charts

## Configuration

**Environment:**
- Runtime env vars read in `src/services/supabase.js`, `src/services/api_tmdb.js`, `src/services/api_rawg.js`
- Example env file at `.env.example`
- Local env file expected at `.env` (gitignored)

**Build:**
- Expo config in `app.json`
- EAS build profile config in `eas.json`
- TypeScript defaults in `tsconfig.json`
- Native Android project present in `android/`

## Platform Requirements

**Development:**
- Node.js + npm for package/scripts
- Expo CLI compatible environment for emulator/device testing
- Supabase project configured for auth/database/storage

**Production:**
- Mobile builds via Expo/EAS pipeline
- Supabase backend availability (Auth, Postgres, Storage, optional Edge Functions)
- Third-party API availability (AniList, TMDB, RAWG, IGDB/news sources)

---
*Stack analysis: 2026-03-19*
*Update after major dependency changes*
