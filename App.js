import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeAnime from './src/pages/home_anime';

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeAnime />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
