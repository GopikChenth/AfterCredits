import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { useMediaFonts, initializeFonts } from './src/utils/mediaThemes';
import HomeAnime from './src/pages/home_anime';
import AnimeDetail from './src/pages/AnimeDetail';

// Initialize font loading system
initializeFonts();

export default function App() {
  const fontsLoaded = useMediaFonts();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <AnimeDetail />
      <StatusBar style="auto" />
    </>
  );
}
