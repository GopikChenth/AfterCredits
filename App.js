import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useMediaFonts, initializeFonts } from './src/utils/mediaThemes';
import HomeAnime from './src/pages/home_anime';
import AnimeDetail from './src/pages/AnimeDetail';
import AnimeReview from './src/pages/AnimeReview';

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
          <Stack.Screen name="HomeAnime" component={HomeAnime} />
          <Stack.Screen name="AnimeDetail" component={AnimeDetail} />
          <Stack.Screen name="AnimeReview" component={AnimeReview} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
