import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMediaFonts, initializeFonts } from './src/utils/mediaThemes';

// Tab Pages
import HomeScreen from './src/pages/home_screen'; // Dynamic — renders correct home based on mediaType
import PostPage from './src/pages/post_anime';
import DiscoverPage from './src/pages/discover_page';
import PodiumPage from './src/pages/podium_page';

// Stack Pages (pushed on top when needed)
import DetailsAnime from './src/pages/details_anime';
import DetailsGames from './src/pages/details_games';
import DetailsMovies from './src/pages/details_movies';
import ReviewPage from './src/pages/review_anime';
import UpcomingPage from './src/pages/upcoming_page';
import NewsPage from './src/pages/news_page';
import PostDetailAnime from './src/pages/post_detail_anime';
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
const Stack = createNativeStackNavigator();

/**
 * Main Tab Navigator
 * HomeScreen dynamically renders the correct home page based on mediaType context.
 */
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <NavBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
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
              animation: 'none',
            }}
          >
            {/* Tab Navigator */}
            <Stack.Screen name="MainTabs" component={MainTabs} />

            {/* Push screens (on top of tabs) */}
            <Stack.Screen name="DetailsAnime" component={DetailsAnime} />
            <Stack.Screen name="DetailsGames" component={DetailsGames} />
            <Stack.Screen name="DetailsMovies" component={DetailsMovies} />
            <Stack.Screen name="ReviewAnime" component={ReviewPage} />
            <Stack.Screen name="UpcomingPage" component={UpcomingPage} />
            <Stack.Screen name="NewsPage" component={NewsPage} />
            <Stack.Screen name="PostDetailAnime" component={PostDetailAnime} />
            <Stack.Screen name="ProfilePage" component={ProfilePage} />
            <Stack.Screen name="AuthPage" component={AuthPage} />
            <Stack.Screen name="PodiumListPage" component={PodiumListPage} />
            <Stack.Screen name="CrewDetailPage" component={CrewDetailPage} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </MediaTypeProvider>
    </SafeAreaProvider>
  );
}
