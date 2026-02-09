import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MediaCard from './Card';

/**
 * InlineSearchResults - Displays search results inline in the main content area
 */
const InlineSearchResults = ({ 
  results = [], 
  isLoading = false,
  searchQuery = '',
  onResultPress,
  onClearSearch,
  theme = { accent: '#FFB3C6' }
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Searching for "{searchQuery}"...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptySubtitle}>Try searching with different keywords</Text>
        <TouchableOpacity 
          onPress={onClearSearch}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back to Browse</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Search Results</Text>
          <Text style={styles.headerCount}>
            {results.length} found for "{searchQuery}"
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onClearSearch}
          style={styles.clearButton}
        >
          <Text style={styles.clearButtonText}>✕ Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Results Grid */}
      <View style={styles.gridContainer}>
        {results.map((item, index) => {
          const { width: screenWidth } = Dimensions.get('window');
          const cardWrapperWidth = (screenWidth - 32 - 12) / 2; // 32 = padding, 12 = gap between columns
          const cardWidth = cardWrapperWidth - 16; // Subtract padding inside wrapper
          const cardHeight = cardWidth * 1.444; // 9:13 aspect ratio
          
          return (
            <View
              key={`${item.id}-${index}`}
              style={[styles.cardWrapper, { width: cardWrapperWidth }]}
            >
              <TouchableOpacity
                onPress={() => onResultPress && onResultPress(item)}
                activeOpacity={0.7}
              >
                <MediaCard
                  theme="anime"
                  title={item.title}
                  year={item.year}
                  imageUrl={item.coverImage}
                  width={cardWidth}
                  height={cardHeight}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerCount: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 179, 198, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#FFB3C6',
    fontWeight: '600',
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#252525',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#999',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: 'rgba(255, 179, 198, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#FFB3C6',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default InlineSearchResults;
