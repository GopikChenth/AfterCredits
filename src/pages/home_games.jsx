import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMediaType } from '../context/MediaTypeContext';

const HomeGames = ({ navigation }) => {
  const { setMediaType } = useMediaType();
  
  useEffect(() => {
    setMediaType('games');
  }, [setMediaType]);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Games</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Placeholder Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎮</Text>
        </View>
        <Text style={styles.title}>Games Coming Soon!</Text>
        <Text style={styles.subtitle}>
          Track your favorite games, complete achievements,{'\n'}
          and discover new titles to play.
        </Text>
        
        <View style={styles.featureList}>
          <FeatureItem icon="game-controller" text="Game library tracking" />
          <FeatureItem icon="trophy" text="Achievement progress" />
          <FeatureItem icon="star" text="Rating and reviews" />
          <FeatureItem icon="people" text="Friend recommendations" />
        </View>
      </View>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon} size={20} color="#10B981" />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featureList: {
    width: '100%',
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#ccc',
  },
});

export default HomeGames;