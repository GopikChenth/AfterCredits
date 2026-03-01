import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  StatusBar,
  Image,
  Keyboard,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMediaType } from '../context/MediaTypeContext';
import { getTrendingMovies, getPopularMovies, getNewMovies, formatMovieData } from '../services/api_movies';
import { searchMedia, debounce } from '../services/search';
import SideBar from '../components/home_page/SideBar';
import SkeletonLoader from '../components/skeletons/SkeletonHome';
import { KeyboardAwareSearchBar } from '../components/home_page/SearchBar';
import SearchSuggestionsOverlay from '../components/home_page/SearchSuggestionsOverlay';
import InlineSearchResults from '../components/home_page/InlineSearchResults';
import { getUserProfile } from '../services/profile';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

const ACCENT = '#FF6B35';

const HomeMovies = ({ navigation }) => {
  const { setMediaType } = useMediaType();
  const tabBarHeight = useBottomTabBarHeight();

  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('movie');
  const [userProfile, setUserProfile] = useState(null);

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);

  // ── Profile ──
  useEffect(() => {
    const loadProfile = async () => {
      const result = await getUserProfile();
      setUserProfile(result.success && result.profile ? result.profile : null);
    };
    loadProfile();
    const unsubscribe = navigation.addListener('focus', () => loadProfile());
    return unsubscribe;
  }, [navigation]);

  // ── Data fetching ──
  const loadMovies = useCallback(async (category = selectedCategory, page = 1) => {
    if (page === 1) setLoading(true);
    else setIsLoadingMore(true);
    try {
      let data;
      switch (category) {
        case 'popular':
          data = await getPopularMovies(page);
          break;
        case 'new':
          data = await getNewMovies(page);
          break;
        case 'trending':
        default:
          data = await getTrendingMovies(page);
      }
      const formatted = (data.results || []).map(formatMovieData);
      setMovies(formatted);
      setCurrentPage(page);
      setHasMore(page < (data.total_pages || 1));
    } catch (error) {
      console.error('Error loading movies:', error);
      setMovies([]);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadMovies(selectedCategory, 1);
  }, [selectedCategory]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setHasMore(true);
    loadMovies(category, 1);
  }, [loadMovies]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadMovies(selectedCategory, currentPage + 1);
    }
  }, [isLoadingMore, hasMore, currentPage, selectedCategory, loadMovies]);

  const handlePrevPage = useCallback(() => {
    if (!isLoadingMore && currentPage > 1) {
      loadMovies(selectedCategory, currentPage - 1);
    }
  }, [isLoadingMore, currentPage, selectedCategory, loadMovies]);

  // ── Search ──
  const performSuggestionSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchMedia(query, 'movie', 3);
        setSearchResults(results);
      } catch (error) {
        console.error('Movie suggestion search error:', error);
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

  const handleSearchSubmit = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    setIsSearchSubmitted(true);
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const results = await searchMedia(searchQuery, 'movie', 50);
      setSearchResults(results);
    } catch (error) {
      console.error('Movie search error:', error);
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
    navigation.navigate('DetailsMovies', {
      movieId: item.id,
      movieTitle: item.title,
      coverImage: item.coverImage,
    });
    handleSearchCancel();
  };

  // ── Render ──
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0A07" />

      {/* Warm ambient glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.menuButton} onPress={() => setIsSidebarVisible(!isSidebarVisible)}>
            <LinearGradient colors={['#FF6B35', '#FF9F1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerBtn}>
              <Ionicons name="menu" size={22} color="#fff" />
            </LinearGradient>
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>MOVIES</Text>
            <View style={styles.titleUnderline} />
          </View>
          <Pressable style={styles.profileButton} onPress={() => navigation.navigate('ProfilePage')}>
            {userProfile ? (
              <Image
                source={{ uri: userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userProfile.username || 'user')}` }}
                style={styles.profileIcon}
              />
            ) : (
              <LinearGradient colors={['#FF6B35', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerBtn}>
                <Ionicons name="person" size={22} color="#fff" />
              </LinearGradient>
            )}
          </Pressable>
        </View>

        {/* Category pills */}
        <View style={styles.categoryContainer}>
          {['trending', 'popular', 'new'].map((cat) => (
            <Pressable
              key={cat}
              onPress={() => handleCategoryChange(cat)}
              style={({ pressed }) => [
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive,
                pressed && styles.categoryPillPressed,
              ]}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat === 'new' ? 'NOW PLAYING' : cat.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search submitted → inline results */}
        {isSearchSubmitted ? (
          <InlineSearchResults
            results={searchResults}
            isLoading={isSearching}
            searchQuery={searchQuery}
            onResultPress={handleSearchResultPress}
            onClearSearch={handleSearchCancel}
            theme={{ accent: ACCENT }}
          />
        ) : loading || isLoadingMore ? (
          <SkeletonLoader count={6} cardHeight={CARD_HEIGHT} />
        ) : (
          <View style={styles.listWrapper}>
            <FlashList
              data={movies}
              keyExtractor={(item) => item.id.toString()}
              estimatedItemSize={CARD_HEIGHT + 12}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flashListContent}
              renderItem={({ item: movie }) => (
                <Pressable
                  style={({ pressed }) => [styles.movieCard, pressed && styles.movieCardPressed]}
                  onPress={() => navigation.navigate('DetailsMovies', {
                    movieId: movie.id,
                    movieTitle: movie.title,
                    coverImage: movie.coverImage,
                  })}
                >
                  {/* Poster */}
                  {movie.coverImage ? (
                    <Image source={{ uri: movie.coverImage }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cardImage, styles.cardPlaceholder]}>
                      <Ionicons name="film-outline" size={32} color="rgba(255,107,53,0.3)" />
                    </View>
                  )}

                  {/* Gradient overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(14,10,7,0.82)', 'rgba(14,10,7,0.97)']}
                    style={styles.cardOverlay}
                  />

                  {/* Score badge */}
                  {movie.score && (
                    <View style={[
                      styles.scoreBadge,
                      { backgroundColor: movie.score >= 70 ? '#10B981' : movie.score >= 50 ? '#FFBE0B' : '#EF4444' },
                    ]}>
                      <Text style={styles.scoreText}>{movie.score}</Text>
                    </View>
                  )}

                  {/* Info */}
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{movie.title}</Text>
                    {movie.year && <Text style={styles.cardYear}>{movie.year}</Text>}
                  </View>
                </Pressable>
              )}
              ListFooterComponent={
                (currentPage > 1 || hasMore) ? (
                  <View style={styles.paginationContainer}>
                    {currentPage > 1 ? (
                      <Pressable style={styles.pageButton} onPress={handlePrevPage}>
                        <Ionicons name="chevron-back" size={16} color={ACCENT} />
                        <Text style={styles.pageButtonText}>Prev</Text>
                      </Pressable>
                    ) : <View style={styles.pageButtonPlaceholder} />}

                    <Text style={styles.pageIndicator}>Page {currentPage}</Text>

                    {hasMore ? (
                      <Pressable style={styles.pageButton} onPress={handleLoadMore}>
                        <Text style={styles.pageButtonText}>Next</Text>
                        <Ionicons name="chevron-forward" size={16} color={ACCENT} />
                      </Pressable>
                    ) : <View style={styles.pageButtonPlaceholder} />}
                  </View>
                ) : null
              }
            />
          </View>
        )}
      </SafeAreaView>

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

      {/* Search Suggestions Overlay */}
      {!isSearchSubmitted && (searchQuery.length >= 2 || isSearching) && (
        <SearchSuggestionsOverlay
          results={searchResults}
          isLoading={isSearching}
          searchQuery={searchQuery}
          onResultPress={handleSearchResultPress}
          onClose={handleSearchCancel}
          theme={{ accent: ACCENT }}
        />
      )}

      {/* Sidebar */}
      <SideBar
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSection={activeSection}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0A07',
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF6B35',
    opacity: 0.06,
  },
  safeArea: {
    flex: 1,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: { width: 44, height: 44 },
  profileButton: { width: 44, height: 44 },
  headerBtn: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  titleContainer: { alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F5F0EB',
    letterSpacing: 4,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
    marginTop: 4,
  },

  // ── Category pills ──
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  categoryPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
    backgroundColor: 'rgba(255,107,53,0.06)',
    alignItems: 'center',
  },
  categoryPillActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  categoryPillPressed: {
    opacity: 0.7,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0876E',
    letterSpacing: 1.5,
  },
  categoryTextActive: {
    color: '#fff',
  },

  // ── FlashList ──
  listWrapper: {
    flex: 1,
    paddingHorizontal: 8,
  },
  flashListContent: {
    paddingBottom: 100,
    paddingTop: 4,
  },

  // ── Movie Card ──
  movieCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    margin: 6,
    backgroundColor: '#1A1209',
  },
  movieCardPressed: {
    transform: [{ scale: 0.96 }],
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  cardPlaceholder: {
    backgroundColor: '#1A1209',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5F0EB',
    lineHeight: 17,
  },
  cardYear: {
    fontSize: 11,
    color: '#A0876E',
    marginTop: 2,
  },

  // ── Pagination ──
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,53,0.12)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    minWidth: 90,
    justifyContent: 'center',
  },
  pageButtonPlaceholder: { minWidth: 90 },
  pageButtonText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pageIndicator: {
    color: '#888',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default HomeMovies;
