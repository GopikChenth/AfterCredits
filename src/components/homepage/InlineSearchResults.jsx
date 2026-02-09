import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';

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
        {results.map((item, index) => (
          <TouchableOpacity
            key={`${item.id}-${index}`}
            style={styles.resultCard}
            onPress={() => onResultPress && onResultPress(item)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.coverImage }}
              style={styles.resultImage}
              resizeMode="cover"
            />
            
            <View style={styles.resultOverlay}>
              <Text style={styles.resultTitle} numberOfLines={2}>
                {item.title}
              </Text>
              
              {item.year && (
                <Text style={styles.yearText}>{item.year}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
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
    gap: 12, // Space between cards
  },
  row: {
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  resultCard: {
    width: '48%',
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  resultImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#333',
  },
  resultOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearText: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
  },
  dotText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 6,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  scoreText: {
    fontSize: 13,
    color: '#FFB3C6',
    fontWeight: '600',
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
