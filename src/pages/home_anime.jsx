import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MediaCard from '../components/homepage/Card';
import NavBar from '../components/homepage/NavBar';
import CategoryPill from '../components/homepage/CategoryPill';
import SideBar from '../components/homepage/SideBar';
import { KeyboardAwareSearchBar } from '../components/homepage/SearchBar';
import { getCardDimensions } from '../utils/responsiveCard';
import { getTrendingAnime, getPopularAnime, getNewAnime, formatAnimeData } from '../services/api_anime';
import { getMediaTheme } from '../utils/mediaThemes';

const HomeAnime = ({ navigation }) => {
  const theme = getMediaTheme('anime');
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

  // Listen for screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      const { cardWidth: newWidth, cardHeight: newHeight } = getCardDimensions();
      setCardWidth(newWidth);
      setCardHeight(newHeight);
    });

    return () => subscription?.remove();
  }, []);

  // Fetch anime data based on category
  const fetchAnimeData = async (category) => {
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
  };

  // Fetch trending anime on mount
  useEffect(() => {
    fetchAnimeData(selectedCategory);
  }, []);
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchAnimeData(category);
  };

  // Split into two columns for masonry layout
  const leftColumn = animeList.filter((_, index) => index % 2 === 0);
  const rightColumn = animeList.filter((_, index) => index % 2 !== 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setIsSidebarVisible(!isSidebarVisible)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Label</Text>
        
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileIcon} />
        </TouchableOpacity>
      </View>

      {/* Masonry Grid with Badge integrated */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.loadingText}>Loading anime...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchAnimeData(selectedCategory)}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {/* Left Column */}
            <View style={styles.column}>
              {/* Category Pill as first item in left column */}
              <View style={styles.badgeWrapper}>
                <CategoryPill
                  categories={['Trending', 'Popular', 'New']}
                  onCategoryChange={handleCategoryChange}
                  width={cardWidth}
                />
              </View>
              
              {leftColumn.map((anime) => (
                <TouchableOpacity 
                  key={anime.id} 
                  style={styles.cardWrapper}
                  onPress={() => navigation?.navigate('DetailsAnime', { animeId: anime.id })}
                >
                  <MediaCard
                    theme="anime"
                    title={anime.title}
                    year={anime.year}
                    imageUrl={anime.coverImage}
                    width={cardWidth}
                    height={cardHeight}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Right Column */}
            <View style={styles.column}>
              {rightColumn.map((anime) => (
                <TouchableOpacity 
                  key={anime.id} 
                  style={styles.cardWrapper}
                  onPress={() => navigation?.navigate('DetailsAnime', { animeId: anime.id })}
                >
                  <MediaCard
                    theme="anime"
                    title={anime.title}
                    year={anime.year}
                    imageUrl={anime.coverImage}
                    width={cardWidth}
                    height={cardHeight}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation - rendered first */}
      <NavBar activeTab="home" onTabChange={(tab) => console.log('Tab changed:', tab)} />

      {/* Search Bar - rendered AFTER NavBar for higher stacking on Android */}
      <KeyboardAwareSearchBar 
        theme="anime"
        placeholder="Search anime..."
        onChangeText={(text) => console.log('Search:', text)}
        onCancel={() => console.log('Search cancelled')}
        defaultBottom={93}
        keyboardOffset={24}
      />
      
      {/* Sidebar */}
      <SideBar 
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          console.log('Section changed:', section);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4, // Minimal spacing
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 80, // Space for SearchBar
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  badgeWrapper: {
    marginBottom: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFB3C6', // Theme accent
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeAnime;
