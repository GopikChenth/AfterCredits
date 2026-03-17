import React from 'react';
import { StyleSheet, View, PanResponder, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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

// ── Tab order for swipe navigation ──────────────────────────────────────────
const TAB_ORDER = ['Home', 'PostPage', 'DiscoverPage', 'PodiumPage'];

/**
 * Wraps a tab screen's content with a horizontal swipe detector.
 * Swiping left → next tab, swiping right → previous tab.
 */
function SwipeTabWrapper({ children, navigation, routeName }) {
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gs) => {
        const { dx, dy, x0 } = gs;
        // Ignore OS-level edge swipes (< 30px from edge)
        const { width } = Dimensions.get('window');
        if (x0 < 30 || x0 > width - 30) return false;
        // Only capture clearly horizontal movements
        return Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 10;
      },
      onPanResponderRelease: (evt, gs) => {
        const { dx, vx } = gs;
        if (Math.abs(dx) < 40 || Math.abs(vx) < 0.2) return;
        const currentIdx = TAB_ORDER.indexOf(routeName);
        if (dx < 0 && currentIdx < TAB_ORDER.length - 1) {
          // Swipe left → next tab
          navigation.navigate(TAB_ORDER[currentIdx + 1]);
        } else if (dx > 0 && currentIdx > 0) {
          // Swipe right → previous tab
          navigation.navigate(TAB_ORDER[currentIdx - 1]);
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

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
      {TAB_ORDER.map((name) => {
        const components = {
          Home: HomeScreen,
          PostPage: PostPage,
          DiscoverPage: DiscoverPage,
          PodiumPage: PodiumPage,
        };
        const Comp = components[name];
        return (
          <Tab.Screen key={name} name={name}>
            {(props) => (
              <SwipeTabWrapper navigation={props.navigation} routeName={name}>
                <Comp {...props} />
              </SwipeTabWrapper>
            )}
          </Tab.Screen>
        );
      })}
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
