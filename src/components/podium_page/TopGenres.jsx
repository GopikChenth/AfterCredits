import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * TopGenres - displays ranked list of user's top anime genres
 * @param {Object} genreStats - { genreName: count, ... }
 */
const TopGenres = ({ genreStats }) => {
  // Convert to array and sort by count
  const sortedGenres = Object.entries(genreStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8); // Top 8 genres

  if (sortedGenres.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No genre data available yet</Text>
      </View>
    );
  }

  const maxCount = sortedGenres[0][1];

  return (
    <View style={styles.container}>
      {sortedGenres.map(([genre, count], index) => {
        const percentage = (count / maxCount) * 100;
        
        return (
          <View key={genre} style={styles.genreRow}>
            <View style={styles.genreInfo}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.genreName}>{genre}</Text>
            </View>
            
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { width: `${percentage}%` },
                  index === 0 && styles.barFirst,
                  index === 1 && styles.barSecond,
                  index === 2 && styles.barThird,
                ]} 
              />
            </View>
            
            <Text style={styles.count}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 30, 30, 0.6)',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Agdasima',
    textAlign: 'center',
    paddingVertical: 20,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    gap: 8,
  },
  rank: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    fontFamily: 'Agdasima',
    width: 24,
  },
  genreName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Agdasima',
    flex: 1,
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#FFB3C6',
    borderRadius: 10,
  },
  barFirst: {
    backgroundColor: '#FFD700', // Gold
  },
  barSecond: {
    backgroundColor: '#C0C0C0', // Silver
  },
  barThird: {
    backgroundColor: '#CD7F32', // Bronze
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFB3C6',
    fontFamily: 'Agdasima',
    width: 32,
    textAlign: 'right',
  },
});

export default TopGenres;
