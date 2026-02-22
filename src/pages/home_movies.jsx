import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import MediaCard from '../components/home_page/Card';
import SkeletonLoader from '../components/skeletons/SkeletonHome';

import CategoryPill from '../components/home_page/CategoryPill';
import SideBar from '../components/home_page/SideBar';
import { KeyboardAwareSearchBar } from '../components/home_page/SearchBar';
import SearchSuggestionsOverlay from '../components/home_page/SearchSuggestionsOverlay';
import InlineSearchResults from '../components/home_page/InlineSearchResults';
import { getCardDimensions } from '../utils/responsiveCard';
import { getTrendingMovies, getPopularMovies, getNewMovies, searchMovies, formatMovieData } from '../services/api_movies';
import { debounce } from '../services/search';
import { getMediaTheme } from '../utils/mediaThemes';
import { useMediaType } from '../context/MediaTypeContext';
import { getUserProfile } from '../services/profile';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const MovieCardItem = React.memo(({ movie, onPress, cardHeight }) => (
  <Pressable style={movieCardStyles.card} onPress={onPress}>
    <View style={movieCardStyles.inner}>
      <MediaCard
        theme="movie"
        title={movie.title}
        year={movie.year}
        imageUrl={movie.coverImage}
        width={'100%'}
        height={cardHeight}
      />
    </View>
  </Pressable>
));
MovieCardItem.displayName = 'MovieCardItem';

const movieCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    backgroundColor: '#1F1209',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  inner: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

const HomeMovies = ({ navigation }) => {
  const theme = getMediaTheme('movie');
  const tabBarHeight = useBottomTabBarHeight();
  const dimensions = getCardDimensions();
  const [cardWidth, setCardWidth] = useState(dimensions.cardWidth);
  const [cardHeight, setCardHeight] = useState(dimensions.cardHeight);

  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('movie');
  const scrollRef = React.useRef(null);

  // Movie data
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);

  // Profile
  const [userProfile, setUserProfile] = useState(null);

  // Responsive dimensions
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', () => {
      const { cardWidth: w, cardHeight: h } = getCardDimensions();
      setCardWidth(w);
      setCardHeight(h);
    });
    return () => sub?.remove();
  }, []);

  // Profile
  useEffect(() => {
    const load = async () => {
      const result = await getUserProfile();
      setUserProfile(result.success && result.profile ? result.profile : null);
    };
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  // Fetch movies
  const fetchMovieData = useCallback(async (category, page = 1) => {
    setIsLoadingMore(page > 1);
    setIsLoading(page === 1);
    setError(null);

    try {
      let response;
      switch (category) {
        case 'Popular':
          response = await getPopularMovies(page, 20);
          break;
        case 'New':
          response = await getNewMovies(page, 20);
          break;
        case 'Trending':
        default:
          response = await getTrendingMovies(page, 20);
          break;
      }


      setMovieList(response.media);
      setCurrentPage(page);
      setHasMore(response.pageInfo?.hasNextPage || false);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load movies. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchMovieData(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryChange = useCallback((category) => {

    setSelectedCategory(category);
    setCurrentPage(1);
    setHasMore(true);
    setMovieList([]);  // Clear old list immediately for visual feedback
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) fetchMovieData(selectedCategory, currentPage + 1);
  }, [isLoadingMore, hasMore, currentPage, selectedCategory, fetchMovieData]);

  const handlePrevPage = useCallback(() => {
    if (!isLoadingMore && currentPage > 1) fetchMovieData(selectedCategory, currentPage - 1);
  }, [isLoadingMore, currentPage, selectedCategory, fetchMovieData]);

  // Search suggestions (debounced)
  const performSuggestionSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const result = await searchMovies(query, 1, 3);
        setSearchResults(result.media.slice(0, 3));
      } catch {
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
    if (text.trim().length >= 2) performSuggestionSearch(text);
    else { setSearchResults([]); setIsSearching(false); }
  }, [performSuggestionSearch]);

  const handleSearchSubmit = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    setIsSearchSubmitted(true);
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const result = await searchMovies(searchQuery, 1, 50);
      setSearchResults(result.media);
    } catch {
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
    // Navigate when details page is ready
    navigation.navigate('DetailsMovies', { movieId: item.id, movieTitle: item.title, coverImage: item.coverImage });
    handleSearchCancel();
  };

  const handleMoviePress = useCallback((movieId) => {
    navigation?.navigate('DetailsMovies', { movieId, movieTitle: 'Loading...' });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

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
        >
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>

        <Text style={styles.headerTitle}>AfterCredits</Text>

        <Pressable
          style={styles.profileButton}
          onPress={() => navigation.navigate('ProfilePage')}
        >
          {userProfile ? (
            <Image
              source={{
                uri: userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userProfile.username || 'user')}`,
              }}
              style={styles.profileIcon}
            />
          ) : (
            <View style={styles.profileIconContainer}>
              <Ionicons name="person-circle-outline" size={48} color="#FF9AA2" />
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
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isSearchSubmitted ? (
            <InlineSearchResults
              results={searchResults}
              isLoading={isSearching}
              searchQuery={searchQuery}
              onResultPress={handleSearchResultPress}
              onClearSearch={handleSearchCancel}
              theme={theme}
              mediaTheme="movie"
            />
          ) : (
            <>
              {/* Hero Section */}
              <View style={styles.heroSection}>
                <View style={styles.heroCard}>
                  <View style={styles.heroRow}>
                    <CategoryPill
                      categories={['Trending', 'Popular', 'New']}
                      onCategoryChange={handleCategoryChange}
                      width={160}
                      accentColor={theme.accent}
                    />
                    <Text style={styles.mediaText}>MOVIES</Text>
                  </View>
                </View>
              </View>

              {isLoading || isLoadingMore ? (
                <SkeletonLoader cardHeight={cardHeight} count={6} />
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => fetchMovieData(selectedCategory)}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.contentWrapper}>
                  <FlashList
                    key={selectedCategory}
                    data={movieList}
                    renderItem={({ item }) => (
                      <MovieCardItem
                        movie={item}
                        onPress={() => handleMoviePress(item.id)}
                        cardHeight={cardHeight}
                      />
                    )}
                    keyExtractor={(item, index) => `${selectedCategory}-${item.id}-${index}`}
                    estimatedItemSize={cardHeight + 16}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.flashListContent}
                    ListFooterComponent={
                      (currentPage > 1 || hasMore) ? (
                        <View style={styles.paginationContainer}>
                          {currentPage > 1 ? (
                            <Pressable
                              style={styles.loadMoreButton}
                              onPress={handlePrevPage}
                            >
                              <Ionicons name="chevron-back" size={16} color="#FF9AA2" />
                              <Text style={styles.loadMoreText}>Prev</Text>
                            </Pressable>
                          ) : (
                            <View style={styles.loadMoreButtonPlaceholder} />
                          )}

                          <Text style={styles.pageIndicator}>Page {currentPage}</Text>

                          {hasMore ? (
                            <Pressable
                              style={styles.loadMoreButton}
                              onPress={handleLoadMore}
                            >
                              <Text style={styles.loadMoreText}>Next</Text>
                              <Ionicons name="chevron-forward" size={16} color="#FF9AA2" />
                            </Pressable>
                          ) : (
                            <View style={styles.loadMoreButtonPlaceholder} />
                          )}
                        </View>
                      ) : null
                    }
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Search Bar */}
      <KeyboardAwareSearchBar
        theme="movie"
        placeholder="Search movies..."
        value={searchQuery}
        onChangeText={handleSearchChange}
        onCancel={handleSearchCancel}
        onSubmit={handleSearchSubmit}
        defaultBottom={8}
        keyboardOffset={8}
        tabBarHeight={tabBarHeight}
      />

      {/* Search Suggestions */}
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
    </SafeAreaView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0A07',
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
    backgroundColor: '#FF4500',   // Deep sunset red
    borderRadius: 152,
    opacity: 0.15,
    transform: [{ scaleX: 1.5 }, { rotate: '25deg' }],
  },
  blobShape2: {
    position: 'absolute',
    top: 96,
    left: -96,
    width: 248,
    height: 248,
    backgroundColor: '#FF6B35',   // Sunset orange
    borderRadius: 124,
    opacity: 0.1,
    transform: [{ scaleY: 1.3 }, { rotate: '-15deg' }],
  },
  blobShape3: {
    position: 'absolute',
    top: 200,
    right: 48,
    width: 200,
    height: 200,
    backgroundColor: '#FFB347',   // Amber glow
    borderRadius: 100,
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
    backgroundColor: '#FF6B35',
  },
  profileIconContainer: {},
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  heroCard: {
    backgroundColor: '#1F1209',
    borderRadius: 16,
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
  mediaText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 16,
  },
  flashListContent: {
    paddingBottom: 80,
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
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    minWidth: 90,
  },
  loadMoreButtonPlaceholder: {
    minWidth: 90,
  },
  loadMoreText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  pageIndicator: {
    color: '#888',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default HomeMovies;
