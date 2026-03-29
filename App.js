import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useMediaFonts, initializeFonts } from './src/utils/mediaThemes';
import { startCacheSweepJob } from './src/services/cacheManager';

// Tab Pages
import HomeScreen from './src/pages/home_screen';
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
import GameStatPage from './src/pages/game_stat_page';

// Custom Tab Bar
import NavBar from './src/components/home_page/NavBar';

// Context
import { MediaTypeProvider } from './src/context/MediaTypeContext';
import { PagerSwipeProvider, usePagerSwipe } from './src/context/PagerSwipeContext';

// Initialize font loading system
initializeFonts();

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Main Tab Navigator — uses material-top-tabs with tabBarPosition='bottom'
 * for native swipe-between-tabs via react-native-pager-view.
 * Reads swipeEnabled from PagerSwipeContext so child components (CategoryPill)
 * can temporarily disable the pager swipe while handling their own gestures.
 */
function MainTabs() {
  const { swipeEnabled } = usePagerSwipe();

  return (
    <Tab.Navigator
      tabBar={(props) => <NavBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        lazy: true,
        // Keep Home locked so CategoryPill horizontal gestures are never hijacked by pager swipe.
        swipeEnabled: route.name === 'Home' ? false : swipeEnabled,
        animationEnabled: true,
      })}
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

  useEffect(() => {
    const stopSweep = startCacheSweepJob();
    return () => stopSweep?.();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <MediaTypeProvider>
        <PagerSwipeProvider>
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
              <Stack.Screen name="GameStatPage" component={GameStatPage} />
            </Stack.Navigator>
            <StatusBar style="auto" />
          </NavigationContainer>
        </PagerSwipeProvider>
      </MediaTypeProvider>
    </SafeAreaProvider>
  );
}
