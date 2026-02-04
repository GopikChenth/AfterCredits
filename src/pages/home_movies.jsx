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
import { getTrendingMovies, getPopularMovies, getNewMovies, formatMovieData } from '../services/api_movies';
import { getMediaTheme } from '../utils/mediaThemes';

const HomeMovies = ({ navigation }) => {
  const theme = getMediaTheme('movie'); // 'movie' theme
  
  // State for responsive dimensions
  const dimensions = getCardDimensions();
  const [cardWidth, setCardWidth] = useState(dimensions.cardWidth);
  const [cardHeight, setCardHeight] = useState(dimensions.cardHeight);
  
  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  
  // State for sidebar
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('movies');

  // State for movie data
  const [movieList, setMovieList] = useState([]);
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

  // Fetch movie data based on category
  const fetchMovieData = async (category) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      switch (category) {
        case 'Popular':
          response = await getPopularMovies(1, 20);
          break;
        case 'New':
          response = await getNewMovies(1, 20);
          break;
        case 'Trending':
        default:
          response = await getTrendingMovies(1, 20);
          break;
      }
      
      // Format the movie data for display
      const formattedMovies = response.media.map(movie => formatMovieData(movie));
      setMovieList(formattedMovies);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load movies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch trending movies on mount
  useEffect(() => {
    fetchMovieData(selectedCategory);
  }, []);
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchMovieData(category);
  };

  // Split into two columns for masonry layout
  const leftColumn = movieList.filter((_, index) => index % 2 === 0);
  const rightColumn = movieList.filter((_, index) => index % 2 !== 0);

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
        
        <Text style={styles.headerTitle}>Movies</Text>
        
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('ProfilePage')}
        >
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
            <Text style={styles.loadingText}>Loading movies...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.accent }]}
              onPress={() => fetchMovieData(selectedCategory)}
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
                  activeColor={theme.accent} // Use theme color
                />
              </View>
              
              {leftColumn.map((movie) => (
                <TouchableOpacity 
                  key={movie.id} 
                  style={styles.cardWrapper}
                  // onPress={() => navigation?.navigate('DetailsMovie', { movieId: movie.id })} // Not created yet
                >
                  <MediaCard
                    theme="movie"
                    title={movie.title}
                    year={movie.year}
                    imageUrl={movie.coverImage}
                    width={cardWidth}
                    height={cardHeight}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Right Column */}
            <View style={styles.column}>
              {rightColumn.map((movie) => (
                <TouchableOpacity 
                  key={movie.id} 
                  style={styles.cardWrapper}
                  // onPress={() => navigation?.navigate('DetailsMovie', { movieId: movie.id })}
                >
                  <MediaCard
                    theme="movie"
                    title={movie.title}
                    year={movie.year}
                    imageUrl={movie.coverImage}
                    width={cardWidth}
                    height={cardHeight}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <NavBar 
        activeTab="home" 
        onTabChange={(tab) => {
          if (tab === 'profile') navigation.navigate('ProfilePage');
          else if (tab === 'home') navigation.navigate('HomeAnime'); // Go back to Anime home
        }} 
      />

      {/* Search Bar */}
      <KeyboardAwareSearchBar 
        theme="movie"
        placeholder="Search movies..."
        onChangeText={(text) => console.log('Search:', text)}
        onCancel={() => console.log('Search cancelled')}
        defaultBottom={93}
        keyboardOffset={24}
        accentColor={theme.accent}
      />
      
      {/* Sidebar */}
      <SideBar 
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          if (section === 'anime') navigation.navigate('HomeAnime');
          // if (section === 'games') navigation.navigate('HomeGames');
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
    paddingVertical: 4, 
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
    paddingBottom: 80, 
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

export default HomeMovies;
