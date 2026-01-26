import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import HomeAnime from './src/pages/home_anime';

export default function App() {
  return (
    <>
      <HomeAnime />
      <StatusBar style="auto" />
    </>
  );
}
