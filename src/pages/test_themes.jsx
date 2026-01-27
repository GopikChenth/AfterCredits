import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import MediaCard from '../components/Card';

/**
 * Test page to demonstrate MediaCard with different themes
 */
const TestThemes = () => {
  const sampleData = {
    title: 'Sample Title',
    genres: ['Action', 'Adventure', 'Drama'],
    imageUrl: 'https://via.placeholder.com/300x400/1a1a2e/eee?text=Media+Card',
    progress: 65,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>MediaCard - Theme Showcase</Text>
        <Text style={styles.subtitle}>All themes using the same component</Text>

        {/* Anime Theme */}
        <View style={styles.section}>
          <Text style={styles.themeLabel}>Anime Theme (Blue #007AFF)</Text>
          <MediaCard 
            theme="anime"
            {...sampleData}
            width={180}
            height={260}
          />
        </View>

        {/* Movie Theme */}
        <View style={styles.section}>
          <Text style={styles.themeLabel}>Movie Theme (Red #FF3B30)</Text>
          <MediaCard 
            theme="movie"
            {...sampleData}
            width={180}
            height={260}
          />
        </View>

        {/* Game Theme */}
        <View style={styles.section}>
          <Text style={styles.themeLabel}>Game Theme (Green #34C759)</Text>
          <MediaCard 
            theme="game"
            {...sampleData}
            width={180}
            height={260}
          />
        </View>

        {/* Comic Theme */}
        <View style={styles.section}>
          <Text style={styles.themeLabel}>Comic Theme (Orange #FF9500)</Text>
          <MediaCard 
            theme="comic"
            {...sampleData}
            width={180}
            height={260}
          />
        </View>

        {/* Manga Theme */}
        <View style={styles.section}>
          <Text style={styles.themeLabel}>Manga Theme (Purple #AF52DE)</Text>
          <MediaCard 
            theme="manga"
            {...sampleData}
            width={180}
            height={260}
          />
        </View>

        {/* Default (fallback to anime) */}
        <View style={styles.section}>
          <Text style={styles.themeLabel}>No Theme (Defaults to Anime)</Text>
          <MediaCard 
            {...sampleData}
            width={180}
            height={260}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default TestThemes;
