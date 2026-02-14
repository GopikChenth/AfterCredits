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
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import MediaCard from '../components/home_page/Card';
import AnimeCardItem from '../components/home_page/AnimeCardItem';

import CategoryPill from '../components/home_page/CategoryPill';
import SideBar from '../components/home_page/SideBar';
import { KeyboardAwareSearchBar } from '../components/home_page/SearchBar';
import SearchSuggestionsOverlay from '../components/home_page/SearchSuggestionsOverlay';
import InlineSearchResults from '../components/home_page/InlineSearchResults';
import { getCardDimensions } from '../utils/responsiveCard';
import { getTrendingAnime, getPopularAnime, getNewAnime, formatAnimeData } from '../services/api_anime';
import { searchMedia, debounce } from '../services/search';
import { getMediaTheme } from '../utils/mediaThemes';
import { useMediaType } from '../context/MediaTypeContext';
import { getUserProfile } from '../services/profile';
import { Ionicons } from '@expo/vector-icons';

const HomeAnime = ({ navigation }) => {
  const theme = getMediaTheme('anime');
  const { setMediaType } = useMediaType();
  
  // Set media type to anime when this page loads
  useEffect(() => {
    setMediaType('anime');
  }, [setMediaType]);
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

  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);

  // State for user profile
  const [userProfile, setUserProfile] = useState(null);

  // Listen for screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      const { cardWidth: newWidth, cardHeight: newHeight } = getCardDimensions();
      setCardWidth(newWidth);
      setCardHeight(newHeight);
    });

    return () => subscription?.remove();
  }, []);

  // Fetch user profile on mount and when page regains focus (e.g., after logout)
  useEffect(() => {
    const loadProfile = async () => {
      const result = await getUserProfile();
      if (result.success && result.profile) {
        setUserProfile(result.profile);
      } else {
        // Clear profile if not logged in
        setUserProfile(null);
      }
    };
    
    loadProfile();
    
    // Add focus listener to reload profile when returning to this page
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    
    return unsubscribe;
  }, [navigation]);

  // Fetch anime data based on category
  const fetchAnimeData = useCallback(async (category) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      switch (category) {
        case 'Popular':
          response = await getPopularAnime(1, 20);
          break;
        case 'New':
          response = await getNewAnime(1, 20);
          break;
        case 'Trending':
        default:
          response = await getTrendingAnime(1, 20);
          break;
      }
      
      // Format the anime data for display
      const formattedAnime = response.media.map(anime => formatAnimeData(anime));
      setAnimeList(formattedAnime);
    } catch (err) {
      console.error('Error fetching anime:', err);
      setError('Failed to load anime. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch trending anime on mount
  useEffect(() => {
    fetchAnimeData(selectedCategory);
  }, []);
  
  // Handle category change
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    fetchAnimeData(category);
  }, [fetchAnimeData]);

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

  // Memoized card width calculation
  const calculatedCardWidth = useMemo(() => {
    return (Dimensions.get('window').width - 56) / 2;
  }, []);

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
                uri: userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userProfile.username || 'user')}`
              }}
              style={styles.profileIcon}
            />
          ) : (
            <View style={styles.profileIconContainer}>
              <Ionicons name="person-circle-outline" size={48} color="#FFB3C6" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Show full search results page when submitted (Enter pressed) */}
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
          <>
            {/* Hero Section with Neumorphic Design */}
            <View style={styles.heroSection}>
              <View style={styles.heroCard}>
                <View style={styles.heroRow}>
                  <CategoryPill
                    categories={['Trending', 'Popular', 'New']}
                    onCategoryChange={handleCategoryChange}
                    width={160}
                  />
                  <Text style={styles.animeText}>ANIME</Text>
                </View>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={styles.loadingText}>Loading anime...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable 
                  style={styles.retryButton}
                  onPress={() => fetchAnimeData(selectedCategory)}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.contentWrapper}>
                {/* Virtualized Grid with FlashList */}
                <FlashList
                  data={animeList}
                  renderItem={({ item }) => (
                    <AnimeCardItem
                      anime={item}
                      onPress={() => handleAnimePress(item.id)}
                      cardHeight={cardHeight}
                    />
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  estimatedItemSize={cardHeight + 16}
                  numColumns={2}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.flashListContent}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>


      {/* Search Bar - rendered AFTER NavBar for higher stacking on Android */}
      <KeyboardAwareSearchBar 
        theme="anime"
        placeholder="Search anime..."
        value={searchQuery}
        onChangeText={handleSearchChange}
        onCancel={handleSearchCancel}
        onSubmit={handleSearchSubmit}
        defaultBottom={8}
        keyboardOffset={32}
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
        onSectionChange={(section) => {
          setActiveSection(section);
          // Navigate to the appropriate page based on section
          if (section === 'anime') {
            // Already on anime page, just close sidebar
            setIsSidebarVisible(false);
          } else if (section === 'movie') {
            navigation.navigate('HomeMovies');
          } else if (section === 'game') {
            navigation.navigate('HomeGames');
          } else if (section === 'comic') {
            navigation.navigate('HomeComics');
          } else if (section === 'manga') {
            navigation.navigate('HomeManga');
          }
        }}
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
    backgroundColor: '#FF6B9D',
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
    backgroundColor: '#FFB3C6',
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
    backgroundColor: '#FFC0CB',
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
    backgroundColor: '#FFB3C6',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  heroCard: {
    backgroundColor: '#252525',
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
  animeText: {
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
    paddingBottom: 16,
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
    backgroundColor: '#FFB3C6',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeAnime;
