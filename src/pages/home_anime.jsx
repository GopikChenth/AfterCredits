import React, { useState, useEffect, useCallback, useMemo, useRef, createRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import MediaCard from '../components/home_page/Card';
import AnimeCardItem from '../components/home_page/AnimeCardItem';
import SkeletonLoader from '../components/skeletons/SkeletonHome';
import QuickActionOverlay from '../components/shared/QuickActionOverlay';
import AuthAlertModal from '../components/shared/AuthAlertModal';

import CategoryPill from '../components/home_page/CategoryPill';
import SideBar from '../components/home_page/SideBar';
import { KeyboardAwareSearchBar } from '../components/home_page/SearchBar';
import SearchSuggestionsOverlay from '../components/home_page/SearchSuggestionsOverlay';
import InlineSearchResults from '../components/home_page/InlineSearchResults';
import { getCardDimensions } from '../utils/responsiveCard';
import { getTrendingAnime, getPopularAnime, getNewAnime, formatAnimeData } from '../services/api_anilist';
import { searchMedia, debounce } from '../services/search';
import { setMediaStatus, setWishlist } from '../services/mediaStatusService';
import { getMediaTheme } from '../utils/mediaThemes';
import { useMediaType } from '../context/MediaTypeContext';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '../stores/useProfileStore';

const PAGE_SIZE = 20;

const HomeAnime = ({ navigation, setHomeTabSwipeEnabled }) => {
  const theme = getMediaTheme('anime');
  const tabBarHeight = 60; // NavBar height (material-top-tabs has no useBottomTabBarHeight)
  // State for responsive dimensions
  const dimensions = getCardDimensions();
  const [cardWidth, setCardWidth] = useState(dimensions.cardWidth);
  const [cardHeight, setCardHeight] = useState(dimensions.cardHeight);
  
  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  
  // State for sidebar
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('anime');

  // State for anime data
  const [animeList, setAnimeList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fetchRequestIdRef = useRef(0);

  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);

  // State for user profile
  const userProfile = useProfileStore((state) => state.profile);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);

  // Listen for screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      const { cardWidth: newWidth, cardHeight: newHeight } = getCardDimensions();
      setCardWidth(newWidth);
      setCardHeight(newHeight);
    });

    return () => subscription?.remove();
  }, []);

  // Fetch user profile on mount and when page regains focus.
  useEffect(() => {
    fetchProfile();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    
    return unsubscribe;
  }, [navigation, fetchProfile]);

  // Fetch anime data based on category
  const fetchAnimeData = useCallback(async (category, page = 1) => {
    const requestId = ++fetchRequestIdRef.current;
    setIsLoadingMore(page > 1);
    setIsLoading(page === 1);
    setError(null);
    
    try {
      let response;
      switch (category) {
        case 'Popular':
          response = await getPopularAnime(page, PAGE_SIZE);
          break;
        case 'New':
          response = await getNewAnime(page, PAGE_SIZE);
          break;
        case 'Trending':
        default:
          response = await getTrendingAnime(page, PAGE_SIZE);
          break;
      }

      if (requestId !== fetchRequestIdRef.current) return;
      
      // Format the anime data for display
      const formattedAnime = response.media.map(anime => formatAnimeData(anime));
      
      setAnimeList(prev => (page === 1 ? formattedAnime : [...prev, ...formattedAnime]));
      setCurrentPage(page);
      
      // Check if there's more data
      setHasMore(response.pageInfo?.hasNextPage || false);
    } catch (err) {
      if (requestId !== fetchRequestIdRef.current) return;
      console.error('Error fetching anime:', err);
      setError('Failed to load anime. Please try again.');
    } finally {
      if (requestId !== fetchRequestIdRef.current) return;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Fetch trending anime on mount
  useEffect(() => {
    fetchAnimeData(selectedCategory, 1);
  }, [selectedCategory, fetchAnimeData]);
  
  // Handle category change
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setHasMore(true);
    setAnimeList([]);
  }, []);

  // Handle load more (next page)
  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasMore) {
      const nextPage = currentPage + 1;
      fetchAnimeData(selectedCategory, nextPage);
    }
  }, [isLoading, isLoadingMore, hasMore, currentPage, selectedCategory, fetchAnimeData]);

  // Debounced search for suggestions (while typing)
  const performSuggestionSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchMedia(query, 'anime', 3); // Only 3 for suggestions
        setSearchResults(results);
      } catch (error) {
        console.error('Suggestion search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    setIsSearchSubmitted(false);
    
    if (text.trim().length >= 2) {
      performSuggestionSearch(text);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [performSuggestionSearch]);

  // Handle Enter press - show full results
  const handleSearchSubmit = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }

    setIsSearchSubmitted(true);
    Keyboard.dismiss();
    
    setIsSearching(true);
    try {
      const results = await searchMedia(searchQuery, 'anime', 50); // 50 for full page
      setSearchResults(results);
    } catch (error) {
      console.error('Full search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSearchCancel = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setIsSearchSubmitted(false);
  }, []);

  const handleSearchResultPress = (item) => {
    // Navigate to details page
    navigation.navigate('DetailsAnime', { animeId: item.id });
    // Clear search after selection
    handleSearchCancel();
  };

  // Handle navigation to anime details
  const handleAnimePress = useCallback((animeId) => {
    navigation?.navigate('DetailsAnime', { animeId });
  }, [navigation]);

  const handleCategoryGestureStart = useCallback(() => {
    setHomeTabSwipeEnabled?.(false);
  }, [setHomeTabSwipeEnabled]);

  const handleCategoryGestureEnd = useCallback(() => {
    setHomeTabSwipeEnabled?.(true);
  }, [setHomeTabSwipeEnabled]);

  useEffect(() => {
    return () => {
      setHomeTabSwipeEnabled?.(true);
    };
  }, [setHomeTabSwipeEnabled]);

  // ── Long-press quick action state ──
  const [longPressTarget, setLongPressTarget] = useState(null);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const cardRefsMap = useRef({});

  const getCardRef = useCallback((id) => {
    if (!cardRefsMap.current[id]) {
      cardRefsMap.current[id] = createRef();
    }
    return cardRefsMap.current[id];
  }, []);

  const handleCardLongPress = useCallback((anime, columnIndex) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ref = cardRefsMap.current[anime.id];
    if (!ref?.current) return;

    ref.current.measure((x, y, width, height, pageX, pageY) => {
      setLongPressTarget({
        anime,
        cardLayout: { x: pageX, y: pageY, width, height },
        isLeftColumn: columnIndex === 0,
      });
    });
  }, []);

  const handleQuickWishlist = useCallback(async (anime, newWishlistState) => {
    if (!userProfile) {
      setLongPressTarget(null);
      setShowAuthAlert(true);
      return;
    }
    await setWishlist('anime', anime.id, newWishlistState);
  }, [userProfile]);

  const handleQuickCompleted = useCallback(async (anime, newStatus) => {
    if (!userProfile) {
      setLongPressTarget(null);
      setShowAuthAlert(true);
      return;
    }
    await setMediaStatus('anime', anime.id, newStatus);
  }, [userProfile]);

  const handleAuthSignIn = useCallback(() => {
    setShowAuthAlert(false);
    navigation.navigate('AuthPage');
  }, [navigation]);

  // Memoized card width calculation
  const calculatedCardWidth = useMemo(() => {
    return (Dimensions.get('window').width - 56) / 2;
  }, []);

  // Memoized FlashList callbacks
  const renderAnimeCard = useCallback(({ item, index }) => (
    <AnimeCardItem
      ref={getCardRef(item.id)}
      anime={item}
      onPress={() => handleAnimePress(item.id)}
      onLongPress={handleCardLongPress}
      cardHeight={cardHeight}
      columnIndex={index % 2}
    />
  ), [handleAnimePress, handleCardLongPress, cardHeight, getCardRef]);

  const animeKeyExtractor = useCallback((item) => item.id.toString(), []);

  const renderListHeader = useCallback(() => (
    <View style={styles.heroSection}>
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <CategoryPill
            categories={['Trending', 'Popular', 'New']}
            onCategoryChange={handleCategoryChange}
            width={160}
            accentColor={theme.accent}
            onSwipeGestureStart={handleCategoryGestureStart}
            onSwipeGestureEnd={handleCategoryGestureEnd}
          />
          <Text style={styles.animeText}>ANIME</Text>
        </View>
      </View>
    </View>
  ), [
    handleCategoryChange,
    handleCategoryGestureEnd,
    handleCategoryGestureStart,
    theme.accent,
  ]);

  const renderListEmpty = useMemo(() => {
    if (isLoading) {
      return <SkeletonLoader cardHeight={cardHeight} count={6} />;
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable 
            style={styles.retryButton}
            onPress={() => fetchAnimeData(selectedCategory)}
            accessibilityRole="button"
            accessibilityLabel="Retry loading anime"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return null;
  }, [isLoading, error, cardHeight, fetchAnimeData, selectedCategory]);

  const renderListFooter = useMemo(() => {
    if (!isLoadingMore) {
      return <View style={styles.listFooterSpacer} />;
    }
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#A78BFA" />
      </View>
    );
  }, [isLoadingMore]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Organic Background Shapes */}
      <View style={styles.backgroundShapes}>
        <View style={styles.blobShape1} />
        <View style={styles.blobShape2} />
        <View style={styles.blobShape3} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.menuButton}
          onPress={() => setIsSidebarVisible(!isSidebarVisible)}
          accessibilityRole="button"
          accessibilityLabel="Open sidebar menu"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        


        <Pressable 
          style={styles.profileButton}
          onPress={() => navigation.navigate('ProfilePage')}
          accessibilityRole="button"
          accessibilityLabel="Go to profile"
        >
          {userProfile ? (
            <Image
              source={{ 
                uri: userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userProfile.username || 'user')}`
              }}
              style={styles.profileIcon}
            />
          ) : (
            <View style={styles.profileIconContainer}>
              <Ionicons name="person-circle-outline" size={48} color="#A78BFA" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isSearchSubmitted ? (
          <InlineSearchResults
            results={searchResults}
            isLoading={isSearching}
            searchQuery={searchQuery}
            onResultPress={handleSearchResultPress}
            onClearSearch={handleSearchCancel}
            theme={theme}
          />
        ) : (
          <View style={styles.contentWrapper}>
            <FlashList
              data={animeList}
              renderItem={renderAnimeCard}
              keyExtractor={animeKeyExtractor}
              estimatedItemSize={cardHeight + 16}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flashListContent}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderListEmpty}
              ListFooterComponent={renderListFooter}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              removeClippedSubviews
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={6}
              updateCellsBatchingPeriod={50}
              drawDistance={200}
            />
          </View>
        )}
      </KeyboardAvoidingView>


      {/* Search Bar - rendered AFTER NavBar for higher stacking on Android */}
      <KeyboardAwareSearchBar 
        theme="anime"
        placeholder="Search anime..."
        value={searchQuery}
        onChangeText={handleSearchChange}
        onCancel={handleSearchCancel}
        onSubmit={handleSearchSubmit}
        defaultBottom={8}
        keyboardOffset={8}
        tabBarHeight={tabBarHeight}
      />

      {/* Search Suggestions Overlay - Only show when typing, NOT when submitted */}
      {!isSearchSubmitted && (searchQuery.length >= 2 || isSearching) && (
        <SearchSuggestionsOverlay
          results={searchResults}
          isLoading={isSearching}
          searchQuery={searchQuery}
          onResultPress={handleSearchResultPress}
          onClose={handleSearchCancel}
          theme={theme}
        />
      )}
      
      {/* Sidebar */}
      <SideBar 
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSection={activeSection}
      />

      {/* Long-press quick action overlay */}
      <QuickActionOverlay
        visible={!!longPressTarget}
        onClose={() => setLongPressTarget(null)}
        media={longPressTarget?.anime}
        mediaType="anime"
        cardLayout={longPressTarget?.cardLayout}
        cardHeight={cardHeight}
        isLeftColumn={longPressTarget?.isLeftColumn}
        onWishlist={handleQuickWishlist}
        onCompleted={handleQuickCompleted}
      />

      {/* Auth alert for non-logged-in users */}
      <AuthAlertModal
        visible={showAuthAlert}
        onClose={() => setShowAuthAlert(false)}
        onSignIn={handleAuthSignIn}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: 'hidden',
  },
  blobShape1: {
    position: 'absolute',
    top: -48,
    right: -80,
    width: 304,
    height: 304,
    backgroundColor: '#7C3AED',
    borderRadius: 152,
    borderCurve: 'continuous',
    opacity: 0.15,
    transform: [{ scaleX: 1.5 }, { rotate: '25deg' }],
  },
  blobShape2: {
    position: 'absolute',
    top: 96,
    left: -96,
    width: 248,
    height: 248,
    backgroundColor: '#A78BFA',
    borderRadius: 124,
    borderCurve: 'continuous',
    opacity: 0.1,
    transform: [{ scaleY: 1.3 }, { rotate: '-15deg' }],
  },
  blobShape3: {
    position: 'absolute',
    top: 200,
    right: 48,
    width: 200,
    height: 200,
    backgroundColor: '#C4B5FD',
    borderRadius: 100,
    borderCurve: 'continuous',
    opacity: 0.08,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  menuIcon: {
    fontSize: 20,
    color: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: '#A78BFA',
  },
  heroSection: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  heroCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  animeText: {
    fontSize: 36,
    fontFamily: 'Genjiro',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  contentWrapper: {
    flex: 1,
  },
  flashListContent: {
    paddingBottom: 80,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 96,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 96,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFooterSpacer: {
    height: 28,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    minWidth: 90,
  },
  loadMoreButtonPlaceholder: {
    minWidth: 90,
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  pageIndicator: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
});

export default HomeAnime;
