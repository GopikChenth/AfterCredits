import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMediaFonts, initializeFonts } from './src/utils/mediaThemes';

// Tab Pages (kept mounted for seamless switching)
import HomeAnime from './src/pages/home_anime';
import PostPage from './src/pages/post_anime';
import DiscoverPage from './src/pages/discover_page';
import PodiumPage from './src/pages/podium_page';

// Stack Pages (pushed on top when needed)
import DetailsAnime from './src/pages/details_anime';
import ReviewAnime from './src/pages/review_anime';
import UpcomingPage from './src/pages/upcoming_page';
import HomeMovies from './src/pages/home_movies';
import HomeGames from './src/pages/home_games';
import HomeComics from './src/pages/home_comics';
import HomeManga from './src/pages/home_manga';
import ProfilePage from './src/pages/profile_page';
import AuthPage from './src/pages/auth_page';

// Custom Tab Bar
import NavBar from './src/components/home_page/NavBar';

// Context
import { MediaTypeProvider } from './src/context/MediaTypeContext';

// Initialize font loading system
initializeFonts();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Main Tab Navigator — keeps all 4 tabs mounted in memory.
 * Switching tabs is instant with zero re-render flicker.
 */
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <NavBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false, // Pre-render all tabs so first switch is instant
      }}
    >
      <Tab.Screen name="HomeAnime" component={HomeAnime} />
      <Tab.Screen name="PostPage" component={PostPage} />
      <Tab.Screen name="DiscoverPage" component={DiscoverPage} />
      <Tab.Screen name="PodiumPage" component={PodiumPage} />
    </Tab.Navigator>
  );
}

export default function App() {
  const fontsLoaded = useMediaFonts();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <MediaTypeProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="MainTabs"
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
              animationEnabled: false,
            }}
          >
            {/* Tab Navigator (4 main tabs) — no swipe gesture */}
            <Stack.Screen name="MainTabs" component={MainTabs} />

            {/* Push screens (on top of tabs) */}
            <Stack.Screen name="DetailsAnime" component={DetailsAnime} />
            <Stack.Screen name="ReviewAnime" component={ReviewAnime} />
            <Stack.Screen name="UpcomingPage" component={UpcomingPage} />
            <Stack.Screen name="ProfilePage" component={ProfilePage} />
            <Stack.Screen name="AuthPage" component={AuthPage} />

            {/* Other Media Home pages */}
            <Stack.Screen name="HomeMovies" component={HomeMovies} />
            <Stack.Screen name="HomeGames" component={HomeGames} />
            <Stack.Screen name="HomeComics" component={HomeComics} />
            <Stack.Screen name="HomeManga" component={HomeManga} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </MediaTypeProvider>
    </SafeAreaProvider>
  );
}
