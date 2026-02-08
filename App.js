import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useMediaFonts, initializeFonts } from './src/utils/mediaThemes';

// Anime Pages
import HomeAnime from './src/pages/home_anime';
import DetailsAnime from './src/pages/details_anime';
import ReviewAnime from './src/pages/review_anime';

// Other Media Pages
import HomeMovies from './src/pages/home_movies';
import HomeGames from './src/pages/home_games';
import HomeComics from './src/pages/home_comics';
import HomeManga from './src/pages/home_manga';

// Common Pages
import ProfilePage from './src/pages/profile_page';
import AuthPage from './src/pages/auth_page';

// Initialize font loading system
initializeFonts();

const Stack = createStackNavigator();

export default function App() {
  const fontsLoaded = useMediaFonts();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="HomeAnime"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            animationEnabled: false,
          }}
        >
          {/* Anime Routes */}
          <Stack.Screen name="HomeAnime" component={HomeAnime} />
          <Stack.Screen name="DetailsAnime" component={DetailsAnime} />
          <Stack.Screen name="ReviewAnime" component={ReviewAnime} />
          
          {/* Other Media Routes */}
          <Stack.Screen name="HomeMovies" component={HomeMovies} />
          <Stack.Screen name="HomeGames" component={HomeGames} />
          <Stack.Screen name="HomeComics" component={HomeComics} />
          <Stack.Screen name="HomeManga" component={HomeManga} />
          
          {/* Common Routes */}
          <Stack.Screen name="ProfilePage" component={ProfilePage} />
          <Stack.Screen name="AuthPage" component={AuthPage} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
