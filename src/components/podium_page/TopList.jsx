import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * TopList - Unified component for displaying ranked lists (genres, studios, etc.)
 * @param {Object} data - { itemName: count, ... }
 * @param {string} emptyMessage - Message to show when no data
 * @param {string} barColor - Color for the progress bars (default: '#FFB3C6')
 * @param {string} countColor - Color for the count text (default: '#FFB3C6')
 * @param {number} maxItems - Maximum number of items to display (default: 5)
 */
const TopList = ({ 
  data, 
  emptyMessage = 'No data available yet',
  barColor = '#FFB3C6',
  countColor = '#FFB3C6',
  maxItems = 5 
}) => {
  // Convert to array and sort by count
  const sortedItems = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxItems);

  if (sortedItems.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const maxCount = sortedItems[0][1];

  return (
    <View style={styles.container}>
      {sortedItems.map(([itemName, count], index) => {
        const percentage = (count / maxCount) * 100;
        
        return (
          <View key={itemName} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.itemName} numberOfLines={1}>{itemName}</Text>
            </View>
            
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar,
                  { 
                    width: `${percentage}%`,
                    backgroundColor: index < 3 ? undefined : barColor 
                  },
                  index === 0 && styles.barFirst,
                  index === 1 && styles.barSecond,
                  index === 2 && styles.barThird,
                ]} 
              />
            </View>
            
            <Text style={[styles.count, { color: countColor }]}>{count}</Text>
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemInfo: {
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
  itemName: {
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
    fontFamily: 'Agdasima',
    width: 32,
    textAlign: 'right',
  },
});

export default TopList;
