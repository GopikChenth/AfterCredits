import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useMediaFonts, initializeFonts } from './src/utils/mediaThemes';
import HomeAnime from './src/pages/home_anime';
import DetailsAnime from './src/pages/details_anime';
import ReviewAnime from './src/pages/review_anime';
import ProfilePage from './src/pages/profile_page';

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
          <Stack.Screen name="DetailsAnime" component={DetailsAnime} />
          <Stack.Screen name="ReviewAnime" component={ReviewAnime} />
          <Stack.Screen name="ProfilePage" component={ProfilePage} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
