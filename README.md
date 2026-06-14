# AfterCredits

AfterCredits is an entertainment tracking app for people who want one place to keep up with what they watch and play.

Active categories:
- Anime
- Movies
- Games

Coming soon:
- Comics
- Manga

## What You Can Do

- Track what you are currently playing, watching, or planning next
- Add titles to your wishlist
- Mark titles as completed
- Rate and review what you finish
- Build a personal profile around your taste
- Discover new titles through curated sections and updates

## Main Sections

### Home

- Browse personalized sections by media type
- Jump into trending, popular, and relevant picks
- Open detail pages with artwork, key info, and related content

### Post

- Scroll through themed posts and curated highlights
- Explore game award posts by year
- Open individual entries to dive deeper into featured titles

### Discover

- Find upcoming releases
- Check news and fresh updates
- Explore more titles when you want something new

### Podium

- Showcase favorites in a more visual way
- Highlight top picks across your tracked media

## Detail Pages

### Anime

- Season and related-show browsing
- Cast and voice actor information
- Reviews and community reactions

### Movies

- Key story details and cast
- Recommendations for what to watch next
- Reviews and personal ratings

### Games

- Rich game details
- Progress tracking
- Hours played
- DLC and extra content support
- Reviews and personal status updates

## Profile And Settings

- Manage your visible sections
- Reorder sidebar items
- Toggle privacy options like anonymous mode
- Control what parts of the app appear in your experience

## Visual Style

- Separate visual identity for anime, movies, and games
- Dark-theme presentation built for media browsing
- Motion-driven navigation and interactive UI elements

## Availability Notes

- Anime, Movies, and Games are active now
- Comics and Manga appear in the app as upcoming categories and cannot be enabled yet

## Building on an Independent System

Since the native `android` and `ios` build directories are generated dynamically and excluded from version control (configured in `.gitignore`), follow these steps to setup and build the app on a clean, independent system:

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18+ or v20+ recommended)
- **Java Development Kit (JDK)** (JDK 17 or 21 is required for React Native 0.81 / Expo SDK 54)
- **Android SDK** (Android Studio or Command Line Tools with Android SDK Platform 34/35)

### Environment Variables & API Keys

Before building or running the project, you need to configure your environment variables. 

1. Copy the [.env.example](file:///s:/Web%20Projects/AfterCredits/.env.example) file to create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
2. Populate the `.env` file with the required keys:

| Environment Variable | Source / Where to Obtain |
| :--- | :--- |
| `EXPO_PUBLIC_SUPABASE_URL` | The URL of your Supabase project. Find it in the **Supabase Dashboard** -> Project Settings -> API. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | The anonymous public key. Find it in the **Supabase Dashboard** -> Project Settings -> API. |
| `EXPO_PUBLIC_RAWG_API_KEY` | Games metadata API key. Register a free account at [rawg.io/apidocs](https://rawg.io/apidocs) to generate one. |
| `EXPO_PUBLIC_IGDB_CLIENT_ID` | Twitch/IGDB Developer Client ID. Register your app on the [Twitch Developer Portal](https://dev.twitch.tv/console). |
| `EXPO_PUBLIC_IGDB_ACCESS_TOKEN` | Twitch App Access Token. Generate it using your Client ID & Client Secret via Twitch's OAuth credentials endpoint (see [IGDB Authentication Docs](https://api-docs.igdb.com/#authentication)). |
| `EXPO_PUBLIC_TMDB_API_KEY` | Movies and TV series data API key. Register on [themoviedb.org](https://www.themoviedb.org/) and request a key in Account Settings -> API. |

### Step 1: Install Dependencies

Clone the repository and install the npm packages:
```bash
npm install
```

### Step 2: Set Environment Variables

Configure your shell environment to point to your Android SDK and Java installation.

#### For Windows (PowerShell):
```powershell
$env:ANDROID_HOME = "S:\Software\Android"        # Update with your SDK path
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"  # Update with your JDK path
```

#### For macOS / Linux (Bash or Zsh):
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

### Step 3: Generate Native Folders (Prebuild)

Run Expo's prebuild command to generate the native platform files:
```bash
npx expo prebuild --platform android --no-install
```

### Step 4: Build the Standalone APK

Compile the release APK locally using the Gradle wrapper:

#### On Windows (PowerShell):
```powershell
.\android\gradlew.bat assembleRelease --project-dir android
```

#### On macOS / Linux:
```bash
cd android && ./gradlew assembleRelease
```

### Step 5: Locate the Built APK

Once the build finishes, the standalone release APK will be available at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Troubleshooting

- **"Resource busy or locked" (Windows)**: Run this to stop background Java processes:
  ```powershell
  Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
  ```
- **App starts in Dev Launcher mode / asks for localhost**: Ensure `expo-dev-client` is not installed or causing conflicts:
  ```bash
  npm uninstall expo-dev-client
  # On Windows:
  cmd /c "rd /s /q android"
  # On macOS/Linux:
  rm -rf android
  npx expo prebuild --platform android --no-install
  ```

## Legal

- [EULA](./EULA.md)
- [Source License](./LICENSE.md)
