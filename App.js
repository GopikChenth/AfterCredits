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
import NewsPage from './src/pages/news_page';
import PostDetailAnime from './src/pages/post_detail_anime';
import HomeMovies from './src/pages/home_movies';
import GameHome from './src/pages/game_home';
import HomeComics from './src/pages/home_comics';
import HomeManga from './src/pages/home_manga';
import ProfilePage from './src/pages/profile_page';
import AuthPage from './src/pages/auth_page';
import PodiumListPage from './src/pages/podium_list_page';
import CrewDetailPage from './src/pages/crew_anime';

// Custom Tab Bar
import NavBar from './src/components/home_page/NavBar';

// Context
import { MediaTypeProvider } from './src/context/MediaTypeContext';

// Initialize font loading system
initializeFonts();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Main Tab Navigator — keeps core tabs mounted in memory.
 * HomeGames is a hidden tab (not in NavBar tabConfig) so the
 * nav bar stays visible when the user switches to games.
 */
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <NavBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false,
      }}
    >
      <Tab.Screen name="HomeAnime" component={HomeAnime} />
      <Tab.Screen name="HomeGames" component={GameHome} options={{ lazy: true }} />
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
            <Stack.Screen name="NewsPage" component={NewsPage} />
            <Stack.Screen name="PostDetailAnime" component={PostDetailAnime} />
            <Stack.Screen name="ProfilePage" component={ProfilePage} />
            <Stack.Screen name="AuthPage" component={AuthPage} />
            <Stack.Screen name="PodiumListPage" component={PodiumListPage} />
            <Stack.Screen name="CrewDetailPage" component={CrewDetailPage} />

            {/* Other Media Home pages (without nav bar) */}
            <Stack.Screen name="HomeMovies" component={HomeMovies} />
            <Stack.Screen name="HomeComics" component={HomeComics} />
            <Stack.Screen name="HomeManga" component={HomeManga} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </MediaTypeProvider>
    </SafeAreaProvider>
  );
}
