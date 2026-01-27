import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MediaCard from '../components/Card';
import NavBar from '../components/NavBar';
import CategoryPill from '../components/CategoryPill';
import SearchBar from '../components/SearchBar';
import { getCardDimensions } from '../utils/responsiveCard';

const HomeAnime = () => {
  // State for responsive dimensions
  const dimensions = getCardDimensions();
  const [cardWidth, setCardWidth] = useState(dimensions.cardWidth);
  const [cardHeight, setCardHeight] = useState(dimensions.cardHeight);
  
  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState('Trending');

  // Listen for screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      const { cardWidth: newWidth, cardHeight: newHeight } = getCardDimensions();
      setCardWidth(newWidth);
      setCardHeight(newHeight);
    });

    return () => subscription?.remove();
  }, []);
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    console.log('Selected category:', category);
    // TODO: Fetch data based on category (trending/popular/new)
  };

  // Sample anime data - replace with API data later
  const animeList = [
    { id: 1, title: 'Title', genres: ['Genre', 'Genre', 'Genre'], imageUrl: 'https://images.unsplash.com/photo-1528702748617-c64d49f918af?w=400', progress: 65, height: 200 },
    { id: 2, title: 'Title', genres: ['Genre', 'Genre', 'Genre'], imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', progress: 40, height: 240 },
    { id: 3, title: 'Title', genres: ['Genre', 'Genre', 'Genre'], imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400', progress: 80, height: 200 },
    { id: 4, title: 'Title', genres: ['Genre', 'Genre', 'Genre'], imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400', progress: 20, height: 180 },
    { id: 5, title: 'Title', genres: ['Genre', 'Genre', 'Genre'], imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', progress: 55, height: 220 },
    { id: 6, title: 'Title', genres: ['Genre', 'Genre', 'Genre'], imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400', progress: 90, height: 200 },
  ];

  // Split into two columns for masonry layout
  const leftColumn = animeList.filter((_, index) => index % 2 === 0);
  const rightColumn = animeList.filter((_, index) => index % 2 !== 0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
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
              <View key={anime.id} style={styles.cardWrapper}>
                <MediaCard
                  theme="anime"
                  title={anime.title}
                  genres={anime.genres}
                  imageUrl={anime.imageUrl}
                  progress={anime.progress}
                  width={cardWidth}
                  height={cardHeight}
                />
              </View>
            ))}
          </View>

          {/* Right Column */}
          <View style={styles.column}>
            {rightColumn.map((anime) => (
              <View key={anime.id} style={styles.cardWrapper}>
                <MediaCard
                  theme="anime"
                  title={anime.title}
                  genres={anime.genres}
                  imageUrl={anime.imageUrl}
                  progress={anime.progress}
                  width={cardWidth}
                  height={cardHeight}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Search Bar - Floating overlay above NavBar */}
      <View style={styles.searchBarOverlay}>
        <SearchBar 
          theme="anime"
          placeholder="Search anime..."
          onChangeText={(text) => console.log('Search:', text)}
          onCancel={() => console.log('Search cancelled')}
        />
      </View>

      {/* Bottom Navigation */}
      <NavBar activeTab="home" onTabChange={(tab) => console.log('Tab changed:', tab)} />
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
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
    paddingBottom: 140, // Extra padding for SearchBar + NavBar
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
  searchBarOverlay: {
    position: 'absolute',
    bottom: 70, // Above NavBar (NavBar is ~60px tall)
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10, // Float above content
  },
});

export default HomeAnime;
