import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar,
  Keyboard,
  ActivityIndicator,
  Animated,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Path as SkiaPath, Skia } from '@shopify/react-native-skia';
import { getTrendingMovies, getPopularMovies, getNewMovies, formatMovieData } from '../services/api_tmdb';
import { searchMedia, debounce } from '../services/search';
import SideBar from '../components/home_page/SideBar';
import SkeletonLoader from '../components/skeletons/SkeletonHome';
import { KeyboardAwareSearchBar } from '../components/home_page/SearchBar';
import SearchSuggestionsOverlay from '../components/home_page/SearchSuggestionsOverlay';
import InlineSearchResults from '../components/home_page/InlineSearchResults';
import { useProfileStore } from '../stores/useProfileStore';
import { getMediaTheme } from '../utils/mediaThemes';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:        '#0A0A0A',   // near-black background
  surface:   '#141414',   // card/panel surface
  surface2:  '#1C1C1C',   // slightly lighter surface
  orange:    '#FF6B35',   // primary accent
  orangeDim: '#CC4E1F',   // darker orange
  orangeSoft:'#FF8C5E',   // lighter orange
  cream:     '#F5EEE6',   // warm off-white text
  muted:     '#6B5444',   // muted warm brown
  border:    '#2A2A2A',   // subtle border
  text:       '#ECECEC',
};

const MOVIE_THEME = getMediaTheme('movie');
const { width: SW } = Dimensions.get('window');

// Card sizing
const GRID_COLS    = 2;
const GRID_MARGIN  = 10;
const CARD_W       = (SW - GRID_MARGIN * (GRID_COLS + 1)) / GRID_COLS;
const CARD_H       = CARD_W * 1.52;

// Featured card (first item shown larger)
const FEAT_H       = SW * 0.55;
const CARD_H_TALL  = CARD_W * 1.65;   // left column
const CARD_H_SHORT = CARD_W * 1.15;   // right column

const CATEGORIES = [
  { key: 'trending',  label: 'TRENDING' },
  { key: 'popular',   label: 'POPULAR'  },
  { key: 'new',       label: 'NOW PLAYING' },
];

// ── Skia diagonal header panel ─────────────────────────────────────────────
const buildHeaderPath = (w, h) => {
  const p = Skia.Path.Make();
  p.moveTo(0, 0);
  p.lineTo(w, 0);
  p.lineTo(w, h);
  p.lineTo(0, h);
  p.close();
  return p;
};


// ── Featured carousel (first 4 movies) ────────────────────────────────────────
const CAROUSEL_MOVIES = 4;

const FeaturedCarousel = React.memo(({ movies, onPress }) => {
  const scrollRef = useRef(null);
  const activeIdx = useRef(0);
  const [dotIdx, setDotIdx] = useState(0);
  const dotAnim = useRef(new Animated.Value(0)).current;

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, movies.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * SW, animated: true });
  }, [movies.length]);

  // Auto-advance every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (activeIdx.current + 1) % movies.length;
      goTo(next);
    }, 4000);
    return () => clearInterval(timer);
  }, [movies.length, goTo]);

  const onScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (idx !== activeIdx.current) {
      activeIdx.current = idx;
      setDotIdx(idx);
      Animated.spring(dotAnim, {
        toValue: idx,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    }
  }, [dotAnim]);

  if (!movies || movies.length === 0) return null;

  return (
    <View style={styles.carouselWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {movies.map((movie, i) => (
          <Pressable
            key={movie.id}
            style={({ pressed }) => [styles.featCard, pressed && styles.cardPressed]}
            onPress={() => onPress(movie)}
            accessibilityRole="button"
            accessibilityLabel={`View movie: ${movie.title}`}
          >
            {movie.coverImage ? (
              <Image
                source={{ uri: movie.coverImage }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                recyclingKey={`feat-${movie.id}`}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="film-outline" size={48} color={C.orange} />
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(10,10,10,0.4)', 'rgba(10,10,10,0.97)']}
              style={StyleSheet.absoluteFill}
            />
            {/* Left accent bar */}
            <View style={styles.featAccentBar} />
            <View style={styles.featContent}>
              <View style={styles.featBadgeRow}>
                <View style={styles.featBadge}>
                  <Text style={styles.featBadgeText}>FEATURED</Text>
                </View>
                {movie.year ? <Text style={styles.featYear}>{movie.year}</Text> : null}
              </View>
              <Text style={styles.featTitle} numberOfLines={2}>{movie.title}</Text>
            </View>
            {/* Slide counter */}
            <View style={styles.featCounter}>
              <Text style={styles.featCounterText}>{i + 1}/{movies.length}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {movies.map((_, i) => (
          <Pressable key={i} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View style={[styles.dot, dotIdx === i && styles.dotActive]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
});

// ── Regular grid card (masonry: accepts explicit height) ─────────────────────
const MovieCard = React.memo(({ movie, onPress, cardHeight }) => (
  <Pressable
    style={({ pressed }) => [styles.movieCard, { height: cardHeight }, pressed && styles.cardPressed]}
    onPress={() => onPress(movie)}
    accessibilityRole="button"
    accessibilityLabel={`View movie: ${movie.title}`}
  >
    {movie.coverImage ? (
      <Image source={{ uri: movie.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={`mov-${movie.id}`} />
    ) : (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="film-outline" size={28} color={C.orange} />
      </View>
    )}
    <LinearGradient
      colors={['transparent', 'rgba(10,10,10,0.65)', 'rgba(10,10,10,0.98)']}
      style={StyleSheet.absoluteFill}
    />
    {/* Bottom-left orange notch accent */}
    <View style={styles.cardNotch} />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={2}>{movie.title}</Text>
      {movie.year ? <Text style={styles.cardYear}>{movie.year}</Text> : null}
    </View>
  </Pressable>
));

// ── Main screen ───────────────────────────────────────────────────────────────
const HomeMovies = ({ navigation }) => {
  const tabBarHeight = 60; // NavBar height (material-top-tabs has no useBottomTabBarHeight)

  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [movies, setMovies]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const [hasMore, setHasMore]             = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const userProfile  = useProfileStore(s => s.profile);
  const fetchProfile = useProfileStore(s => s.fetchProfile);

  const [searchQuery, setSearchQuery]             = useState('');
  const [searchResults, setSearchResults]         = useState([]);
  const [isSearching, setIsSearching]             = useState(false);
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);

  const catUnderlineAnim = useRef(new Animated.Value(0)).current;
  const catIdx = CATEGORIES.findIndex(c => c.key === selectedCategory);

  // Animate the underline tab indicator
  useEffect(() => {
    Animated.spring(catUnderlineAnim, {
      toValue: catIdx,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [catIdx]);

  const TAB_W = (SW - 32) / CATEGORIES.length;

  // ── Profile ──
  useEffect(() => {
    fetchProfile();
    const unsub = navigation.addListener('focus', fetchProfile);
    return unsub;
  }, [navigation, fetchProfile]);

  // ── Data fetching ──
  const loadMovies = useCallback(async (category = selectedCategory, page = 1) => {
    if (page === 1) setLoading(true);
    else setIsLoadingMore(true);
    try {
      let data;
      switch (category) {
        case 'popular': data = await getPopularMovies(page); break;
        case 'new':     data = await getNewMovies(page);     break;
        default:        data = await getTrendingMovies(page);
      }
      const formatted = (data.results || []).map(formatMovieData);
      setMovies(formatted);
      setCurrentPage(page);
      setHasMore(page < (data.total_pages || 1));
    } catch (err) {
      console.error('Error loading movies:', err);
      setMovies([]);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory]);

  useEffect(() => { loadMovies(selectedCategory, 1); }, [selectedCategory]);

  const handleCategoryChange = useCallback((cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    setHasMore(true);
    loadMovies(cat, 1);
  }, [loadMovies]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) loadMovies(selectedCategory, currentPage + 1);
  }, [isLoadingMore, hasMore, currentPage, selectedCategory, loadMovies]);

  const handlePrevPage = useCallback(() => {
    if (!isLoadingMore && currentPage > 1) loadMovies(selectedCategory, currentPage - 1);
  }, [isLoadingMore, currentPage, selectedCategory, loadMovies]);

  // ── Search ──
  const performSuggestionSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) { setSearchResults([]); setIsSearching(false); return; }
      setIsSearching(true);
      try { setSearchResults(await searchMedia(query, 'movies', 3)); }
      catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 500), []
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
    try { setSearchResults(await searchMedia(searchQuery, 'movies', 50)); }
    catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  }, [searchQuery]);

  const handleSearchCancel = useCallback(() => {
    setSearchQuery(''); setSearchResults([]);
    setIsSearching(false); setIsSearchSubmitted(false);
  }, []);

  const handleSearchResultPress = useCallback((item) => {
    navigation.navigate('DetailsMovies', { movieId: item.id, movieTitle: item.title, coverImage: item.coverImage });
    handleSearchCancel();
  }, [navigation, handleSearchCancel]);

  const handleMoviePress = useCallback((movie) => {
    navigation.navigate('DetailsMovies', { movieId: movie.id, movieTitle: movie.title, coverImage: movie.coverImage });
  }, [navigation]);

  // ── Masonry height sequence — 12 values, no obvious repeat ──
  // Left/right columns each index independently so patterns don't align
  const MASONRY_HEIGHTS = [1.65, 1.1, 1.5, 1.25, 1.7, 1.15, 1.45, 1.35, 1.6, 1.2, 1.55, 1.3];
  const getMasonryHeight = (colIndex) => CARD_W * MASONRY_HEIGHTS[colIndex % MASONRY_HEIGHTS.length];

  // Build Skia header path
  const [headerSize, setHeaderSize] = useState({ w: 0, h: 0 });
  const headerPath = useMemo(() => {
    if (!headerSize.w || !headerSize.h) return null;
    return buildHeaderPath(headerSize.w, headerSize.h);
  }, [headerSize]);


  const renderListFooter = useCallback(() => {
    if (!(currentPage > 1 || hasMore)) return null;
    return (
      <View style={styles.paginationContainer}>
        {currentPage > 1 ? (
          <Pressable
            style={[styles.pageButton, isLoadingMore && styles.pageButtonDisabled]}
            onPress={handlePrevPage}
            disabled={isLoadingMore}
            accessibilityRole="button"
            accessibilityLabel="Previous page"
          >
            <Ionicons name="chevron-back" size={16} color={C.orange} />
            <Text style={styles.pageButtonText}>PREV</Text>
          </Pressable>
        ) : <View style={styles.pageButtonPlaceholder} />}

        <Text style={styles.pageIndicator}>PAGE {currentPage}</Text>

        {hasMore ? (
          <Pressable
            style={[styles.pageButton, isLoadingMore && styles.pageButtonDisabled]}
            onPress={handleLoadMore}
            disabled={isLoadingMore}
            accessibilityRole="button"
            accessibilityLabel="Next page"
          >
            {isLoadingMore
              ? <ActivityIndicator size="small" color={C.orange} />
              : <>
                  <Text style={styles.pageButtonText}>NEXT</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.orange} />
                </>
            }
          </Pressable>
        ) : <View style={styles.pageButtonPlaceholder} />}
      </View>
    );
  }, [currentPage, hasMore, isLoadingMore, handlePrevPage, handleLoadMore]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* ── Header panel with Skia diagonal ── */}
        <View
          style={styles.headerPanel}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            setHeaderSize({ w: width, h: height });
          }}
        >
          {/* Skia diagonal fill */}
          {headerPath ? (
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              <SkiaPath path={headerPath} color="#161616" />
            </Canvas>
          ) : null}

          <View style={styles.headerRow}>
            {/* Menu button */}
            <Pressable
              style={styles.menuButton}
              onPress={() => setIsSidebarVisible(v => !v)}
              accessibilityRole="button"
              accessibilityLabel="Open sidebar menu"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="menu" size={22} color={C.cream} />
            </Pressable>

            {/* Title */}
            <View style={styles.titleBlock}>
              <View style={styles.titleRow}>
                <View style={styles.titleOrangeBar} />
                <Text style={styles.titleText}>MOVIES</Text>
              </View>
              <Text style={styles.titleSub}>AfterCredits</Text>
            </View>

            {/* Profile */}
            <Pressable
              style={styles.profileButton}
              onPress={() => navigation.navigate('ProfilePage')}
              accessibilityRole="button"
              accessibilityLabel="Go to profile"
            >
              {userProfile ? (
                <Image
                  source={{ uri: userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userProfile.username || 'user')}` }}
                  style={styles.profileIcon}
                />
              ) : (
                <View style={styles.profileFallback}>
                  <Ionicons name="person" size={20} color={C.orange} />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* ── Content ── */}
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
              theme={MOVIE_THEME}
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Featured carousel — first 4 movies */}
              {movies.length > 0 && !loading ? (
                <FeaturedCarousel movies={movies.slice(0, CAROUSEL_MOVIES)} onPress={handleMoviePress} />
              ) : null}

              {/* Category tabs */}
              <View style={styles.listHeader}>
                <View style={styles.tabsRow}>
                  {CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                      <Pressable
                        key={cat.key}
                        style={styles.tabItem}
                        onPress={() => handleCategoryChange(cat.key)}
                        accessibilityRole="tab"
                        accessibilityLabel={cat.label}
                      >
                        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.tabUnderlineTrack}>
                  <Animated.View
                    style={[
                      styles.tabUnderline,
                      {
                        width: TAB_W,
                        transform: [{ translateX: Animated.multiply(catUnderlineAnim, TAB_W) }],
                      },
                    ]}
                  />
                </View>
              </View>

              {/* ── True two-column masonry grid ── */}
              {loading ? (
                <SkeletonLoader count={6} cardHeight={CARD_H_TALL} variant="masonry" />
              ) : (
                <View style={styles.masonryRow}>
                  {/* Left column */}
                  <View style={styles.masonryCol}>
                    {movies.slice(CAROUSEL_MOVIES).filter((_, i) => i % 2 === 0).map((movie, colIdx) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onPress={handleMoviePress}
                        cardHeight={getMasonryHeight(colIdx)}
                      />
                    ))}
                  </View>
                  {/* Right column — offset height sequence by 5 for visual variety */}
                  <View style={styles.masonryCol}>
                    {movies.slice(CAROUSEL_MOVIES).filter((_, i) => i % 2 === 1).map((movie, colIdx) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onPress={handleMoviePress}
                        cardHeight={getMasonryHeight(colIdx + 5)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Pagination */}
              {(currentPage > 1 || hasMore) && (
                <View style={styles.paginationContainer}>
                  {currentPage > 1 ? (
                    <Pressable
                      style={[styles.pageButton, isLoadingMore && styles.pageButtonDisabled]}
                      onPress={handlePrevPage}
                      disabled={isLoadingMore}
                      accessibilityRole="button"
                      accessibilityLabel="Previous page"
                    >
                      <Ionicons name="chevron-back" size={16} color={C.orange} />
                      <Text style={styles.pageButtonText}>PREV</Text>
                    </Pressable>
                  ) : <View style={styles.pageButtonPlaceholder} />}

                  <Text style={styles.pageIndicator}>PAGE {currentPage}</Text>

                  {hasMore ? (
                    <Pressable
                      style={[styles.pageButton, isLoadingMore && styles.pageButtonDisabled]}
                      onPress={handleLoadMore}
                      disabled={isLoadingMore}
                      accessibilityRole="button"
                      accessibilityLabel="Next page"
                    >
                      {isLoadingMore
                        ? <ActivityIndicator size="small" color={C.orange} />
                        : <>
                            <Text style={styles.pageButtonText}>NEXT</Text>
                            <Ionicons name="chevron-forward" size={16} color={C.orange} />
                          </>
                      }
                    </Pressable>
                  ) : <View style={styles.pageButtonPlaceholder} />}
                </View>
              )}
            </ScrollView>

          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Search bar ── */}
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

      {/* ── Search suggestions ── */}
      {!isSearchSubmitted && (searchQuery.length >= 2 || isSearching) && (
        <SearchSuggestionsOverlay
          results={searchResults}
          isLoading={isSearching}
          searchQuery={searchQuery}
          onResultPress={handleSearchResultPress}
          onClose={handleSearchCancel}
          theme={MOVIE_THEME}
        />
      )}

      {/* ── Sidebar ── */}
      <SideBar
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSection="movies"
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header panel ──
  headerPanel: {
    paddingBottom: 28,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  menuButton: {
    width: 44, height: 44,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  titleBlock: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleOrangeBar: {
    width: 4,
    height: 32,
    backgroundColor: C.orange,
    borderRadius: 2,
  },
  titleText: {
    fontSize: 30,
    fontFamily: 'Genjiro',
    color: C.cream,
    letterSpacing: 5,
    textShadowColor: C.orange,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  titleSub: {
    fontSize: 10,
    color: C.muted,
    letterSpacing: 3,
    fontWeight: '500',
    marginTop: 2,
  },
  profileButton: {
    width: 44, height: 44,
    borderRadius: 8,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  profileIcon: {
    width: 44, height: 44,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  profileFallback: {
    width: 44, height: 44,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.orangeDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Tabs ──
  listHeader: {
    paddingTop: 4,
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.8,
  },
  tabLabelActive: {
    color: C.orange,
  },
  tabUnderlineTrack: {
    height: 2,
    backgroundColor: C.surface2,
    marginHorizontal: 16,
  },
  tabUnderline: {
    height: 2,
    backgroundColor: C.orange,
    borderRadius: 1,
  },

  // ── Featured carousel ──
  carouselWrapper: {
    position: 'relative',
  },
  featCard: {
    width: SW,
    height: FEAT_H,
    marginTop: 4,
  },
  featCounter: {
    position: 'absolute',
    top: 12, right: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  featCounterText: {
    color: C.cream,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.muted,
  },
  dotActive: {
    backgroundColor: C.orange,
    width: 20,
    borderRadius: 3,
  },

  featAccentBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    backgroundColor: C.orange,
  },
  featContent: {
    position: 'absolute',
    left: 14, right: 14, bottom: 16,
  },
  featBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  featBadge: {
    backgroundColor: C.orange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderCurve: 'continuous',
  },
  featBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  featYear: {
    fontSize: 11,
    color: C.muted,
    fontWeight: '600',
    letterSpacing: 1,
  },
  featTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: C.cream,
    letterSpacing: 0.5,
    lineHeight: 30,
  },

  // ── Grid card ──
  movieCard: {
    margin: GRID_MARGIN / 2,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  cardNotch: {
    position: 'absolute',
    left: 0, bottom: 0,
    width: 3,
    height: 36,
    backgroundColor: C.orange,
    borderTopRightRadius: 2,
  },
  cardContent: {
    position: 'absolute',
    left: 10, right: 10, bottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C.cream,
    lineHeight: 16,
    marginBottom: 2,
  },
  cardYear: {
    fontSize: 10,
    color: C.muted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Scroll / masonry ──
  scrollContent: {
    paddingBottom: 100,
  },
  masonryRow: {
    flexDirection: 'row',
    paddingHorizontal: GRID_MARGIN / 2,
  },
  masonryCol: {
    flex: 1,
  },

  // ── Pagination ──
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: C.orangeDim,
    minWidth: 90,
    justifyContent: 'center',
  },
  pageButtonDisabled: { opacity: 0.5 },
  pageButtonPlaceholder: { minWidth: 90 },
  pageButtonText: {
    color: C.orange,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  pageIndicator: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
});

export default HomeMovies;
