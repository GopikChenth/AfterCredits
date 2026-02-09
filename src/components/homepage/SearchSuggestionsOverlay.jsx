import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * SearchSuggestionsOverlay - Compact suggestions dropdown
 * 
 * Features:
 * - Shows above keyboard
 * - Max 3 suggestions
 * - Keyboard-aware positioning
 * - Backdrop for clearing search
 */
const SearchSuggestionsOverlay = ({ 
  results = [], 
  isLoading = false,
  searchQuery = '',
  onResultPress,
  onClose,
  theme = { accent: '#FFB3C6' }
}) => {
  const bottomAnim = useRef(new Animated.Value(157)).current;
  const keyboardListenersRef = useRef({ show: null, hide: null });

  // Constants
  const CONSTANTS = useMemo(() => ({
    DEFAULT_BOTTOM: 157, // 93 (nav) + 56 (search) + 8 (gap)
    SEARCH_BAR_HEIGHT: 56,
    NAV_BAR_HEIGHT: 93,
    GAP: 8,
  }), []);

  // Calculate position for keyboard-open state
  const calculateKeyboardPosition = useCallback((keyboardHeight) => {
    const searchBarOffset = 32; // Must match search bar's keyboardOffset prop
    return keyboardHeight + searchBarOffset + CONSTANTS.SEARCH_BAR_HEIGHT + CONSTANTS.GAP;
  }, [CONSTANTS]);

  // Keyboard listeners setup
  useEffect(() => {
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event) => {
      const keyboardHeight = event.endCoordinates.height;
      const bottomPosition = calculateKeyboardPosition(keyboardHeight);
      
      Animated.timing(bottomAnim, {
        toValue: bottomPosition,
        duration: Platform.OS === 'ios' ? 250 : 100,
        useNativeDriver: false,
      }).start();
    };

    const handleKeyboardHide = () => {
      Animated.timing(bottomAnim, {
        toValue: CONSTANTS.DEFAULT_BOTTOM,
        duration: Platform.OS === 'ios' ? 250 : 100,
        useNativeDriver: false,
      }).start();
    };

    // Check if keyboard is ALREADY open when component mounts
    // This fixes the timing issue where component mounts after keyboard is visible
    const checkCurrentKeyboard = async () => {
      try {
        // On Android, we can use Keyboard.metrics() to check current state
        if (Platform.OS === 'android') {
          const metrics = await Keyboard.metrics();
          if (metrics && metrics.height > 0) {
            const bottomPosition = calculateKeyboardPosition(metrics.height);
            bottomAnim.setValue(bottomPosition); // Set immediately, no animation
          }
        } else {
          // On iOS, assume keyboard is open since we're in search mode
          // Use a typical iOS keyboard height as fallback
          const typicalIOSKeyboardHeight = 336;
          const bottomPosition = calculateKeyboardPosition(typicalIOSKeyboardHeight);
          bottomAnim.setValue(bottomPosition);
        }
      } catch (e) {
        // Fallback: assume keyboard is open with typical height
        const typicalKeyboardHeight = 300;
        const bottomPosition = calculateKeyboardPosition(typicalKeyboardHeight);
        bottomAnim.setValue(bottomPosition);
      }
    };
    
    checkCurrentKeyboard();

    keyboardListenersRef.current.show = Keyboard.addListener(keyboardShowEvent, handleKeyboardShow);
    keyboardListenersRef.current.hide = Keyboard.addListener(keyboardHideEvent, handleKeyboardHide);

    return () => {
      keyboardListenersRef.current.show?.remove();
      keyboardListenersRef.current.hide?.remove();
    };
  }, [bottomAnim, CONSTANTS, calculateKeyboardPosition]);

  // Handle result press
  const handleResultPress = useCallback((item) => {
    if (onResultPress) {
      onResultPress(item);
    }
  }, [onResultPress]);

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Don't render if no query
  if (!searchQuery || searchQuery.length < 2) {
    return null;
  }

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      );
    }

    // Show max 3 results
    const visibleResults = results.slice(0, 3);

    return (
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {visibleResults.map((item, index) => (
          <TouchableOpacity
            key={`${item.id}-${index}`}
            style={styles.resultItem}
            onPress={() => handleResultPress(item)}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: item.coverImage }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.metaRow}>
                {item.year && (
                  <Text style={styles.yearText}>{item.year}</Text>
                )}
                {item.year && item.score && (
                  <Text style={styles.dotSeparator}>•</Text>
                )}
                {item.score && (
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreIcon}>⭐</Text>
                    <Text style={styles.scoreText}>{item.score}%</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
        
        {results.length > 3 && (
          <View style={styles.moreResults}>
            <Text style={styles.moreResultsText}>
              +{results.length - 3} more results
            </Text>
            <Text style={styles.pressEnterText}>Press Enter to see all</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // Render blur container
  const renderBlurContainer = (children) => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.overlayContainerWeb}>
          {children}
        </View>
      );
    }

    return (
      <BlurView intensity={80} tint="dark" style={styles.overlayContainerNative}>
        {children}
      </BlurView>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <Pressable 
        style={styles.backdrop}
        onPress={handleBackdropPress}
      />
      
      {/* Suggestions Overlay */}
      <Animated.View 
        style={[styles.container, { bottom: bottomAnim }]}
        pointerEvents="box-none"
      >
        {renderBlurContainer(
          <View style={styles.content}>
            {renderContent()}
          </View>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 50, // Below search bar (100)
  },
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxHeight: 310, // Fits 3 full suggestions (each ~94px + padding)
    zIndex: 60, // Below search bar (100) but above backdrop (50)
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  overlayContainerWeb: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  },
  overlayContainerNative: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  thumbnail: {
    width: 50,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearText: {
    fontSize: 12,
    color: '#999',
  },
  dotSeparator: {
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
    marginRight: 2,
  },
  scoreText: {
    fontSize: 12,
    color: '#FFB3C6',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: '#666',
    marginLeft: 8,
  },
  moreResults: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  moreResultsText: {
    color: '#FFB3C6',
    fontSize: 13,
    fontWeight: '600',
  },
  pressEnterText: {
    color: '#999',
    fontSize: 11,
    marginTop: 4,
  },
});

export default SearchSuggestionsOverlay;
