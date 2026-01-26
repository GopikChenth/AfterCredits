# File Organization - AfterCredits

## Deliverables vs Intermediates

**Deliverables**: Production-ready code and assets that ship with the app
**Intermediates**: Development files, build artifacts, and temporary data

---

## Directory Structure

```
AfterCredits/
├─ src/                    # [DELIVERABLE] Application source code
│  ├─ components/          # [DELIVERABLE] Reusable UI components
│  ├─ pages/              # [DELIVERABLE] Screen components
│  ├─ features/           # [DELIVERABLE] Feature modules (anime, movies, etc.)
│  ├─ services/           # [DELIVERABLE] API clients, storage, sync logic
│  ├─ store/              # [DELIVERABLE] Zustand state management
│  ├─ utils/              # [DELIVERABLE] Helper functions
│  ├─ context/            # [DELIVERABLE] React context providers
│  └─ assets/             # [DELIVERABLE] Images, fonts, icons
│
├─ node_modules/          # [INTERMEDIATE] Dependencies (never commit)
├─ .expo/                 # [INTERMEDIATE] Expo cache (never commit)
├─ .tmp/                  # [INTERMEDIATE] Temp files (never commit)
│
├─ android/               # [DELIVERABLE] Android native code (if ejected)
├─ ios/                   # [DELIVERABLE] iOS native code (if ejected)
│
├─ App.js                 # [DELIVERABLE] Root component
├─ app.json               # [DELIVERABLE] Expo configuration
├─ package.json           # [DELIVERABLE] Dependencies manifest
├─ .gitignore             # [DELIVERABLE] Git exclusions
├─ .env                   # [INTERMEDIATE] Environment variables (in .gitignore)
└─ README.md              # [DELIVERABLE] Project documentation
```

---

## Key Files

### Configuration (Deliverable)

- `app.json` - Expo/React Native app configuration
- `package.json` - NPM dependencies and scripts
- `babel.config.js` - JavaScript compiler settings

### Security (Intermediate - Never Commit)

- `.env` - API keys (Supabase, AniList, TMDB, etc.)
- `google-services.json` - Google OAuth (Android)
- `GoogleService-Info.plist` - Google OAuth (iOS)

### Build Artifacts (Intermediate - Never Commit)

- `node_modules/` - Installed dependencies
- `.expo/` - Expo build cache
- `*.apk`, `*.aab` - Android builds
- `*.ipa` - iOS builds
- `dist/`, `build/` - Web builds

---

## Source Code Breakdown

### `/src/components/` - UI Building Blocks

**Purpose**: Reusable components used across multiple screens

**Examples**:

- `AnimeCard.jsx` - Media card component
- `NavBar.jsx` - Bottom navigation
- `Button.jsx`, `Input.jsx` - Generic UI elements

### `/src/pages/` - Screen Components

**Purpose**: Full-screen views that users navigate to

**Examples**:

- `home_anime.jsx` - Anime home screen
- `LoginScreen.jsx` - Authentication screen
- `ProfileScreen.jsx` - User profile

### `/src/features/` - Feature Modules

**Purpose**: Self-contained feature logic (optional organization)

**Structure**:

```
features/
├─ anime/
│  ├─ screens/        # Anime-specific screens
│  ├─ components/     # Anime-specific components
│  └─ hooks/          # Custom hooks for anime
└─ movies/
   └─ ...
```

### `/src/services/` - Business Logic

**Purpose**: API clients, storage, utilities

**Examples**:

- `api/anilist.js` - AniList GraphQL client
- `api/tmdb.js` - TMDB REST client
- `storage/mmkv.js` - Local storage wrapper
- `supabase/client.js` - Supabase config

### `/src/store/` - State Management

**Purpose**: Zustand stores for global state

**Examples**:

- `authStore.js` - User authentication state
- `animeStore.js` - Anime watchlist state
- `syncStore.js` - Offline sync queue

---

## Environment Variables (.env)

**Never commit this file!** Add to `.gitignore`

```
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# AniList (optional, public API)
ANILIST_API=https://graphql.anilist.co

# TMDB
TMDB_API_KEY=xxx

# Google OAuth (if using)
GOOGLE_CLIENT_ID=xxx
```

---

## .gitignore Essentials

```
# Intermediates - Never commit
node_modules/
.expo/
.tmp/
dist/
build/

# Environment & Secrets
.env
.env.local
google-services.json
GoogleService-Info.plist

# OS Files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
```

---

## Build Outputs (Intermediate)

### Android

- `android/app/build/` - Build artifacts
- `*.apk` - Debug/release APKs
- `*.aab` - Google Play bundles

### iOS

- `ios/build/` - Xcode build output
- `*.ipa` - App Store builds

### Web (if using Expo)

- `web-build/` - Static web export

---

## Best Practices

1. **Never commit `.env`** - Use `.env.example` as a template
2. **Keep intermediates local** - Add to `.gitignore`
3. **Version control deliverables** - All source code in Git
4. **Separate concerns** - Features in `/features/`, reusable in `/components/`
5. **Document structure** - Update this file as project grows
