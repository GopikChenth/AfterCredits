import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * TopStudios - displays ranked list of user's top anime studios
 * @param {Object} studioStats - { studioName: count, ... }
 */
const TopStudios = ({ studioStats }) => {
  // Convert to array and sort by count
  const sortedStudios = Object.entries(studioStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8); // Top 8 studios

  if (sortedStudios.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No studio data available yet</Text>
      </View>
    );
  }

  const maxCount = sortedStudios[0][1];

  return (
    <View style={styles.container}>
      {sortedStudios.map(([studio, count], index) => {
        const percentage = (count / maxCount) * 100;
        
        return (
          <View key={studio} style={styles.studioRow}>
            <View style={styles.studioInfo}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.studioName} numberOfLines={1}>{studio}</Text>
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
  studioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studioInfo: {
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
  studioName: {
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
    backgroundColor: '#A0C4FF',
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
    color: '#A0C4FF',
    fontFamily: 'Agdasima',
    width: 32,
    textAlign: 'right',
  },
});

export default TopStudios;
