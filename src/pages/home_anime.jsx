import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Dimensions 
} from 'react-native';
import AnimeCard from '../components/AnimeCard';
import NavBar from '../components/NavBar';


const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

const HomeAnime = () => {
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
            {/* ANIME Badge as first item in left column */}
            <View style={styles.badgeWrapper}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>ANIME</Text>
              </View>
            </View>
            
            {leftColumn.map((anime) => (
              <View key={anime.id} style={styles.cardWrapper}>
                <AnimeCard
                  title={anime.title}
                  genres={anime.genres}
                  imageUrl={anime.imageUrl}
                  progress={anime.progress}
                />
              </View>
            ))}
          </View>

          {/* Right Column */}
          <View style={styles.column}>
            {rightColumn.map((anime) => (
              <View key={anime.id} style={styles.cardWrapper}>
                <AnimeCard
                  title={anime.title}
                  genres={anime.genres}
                  imageUrl={anime.imageUrl}
                  progress={anime.progress}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <NavBar activeTab="home" onTabChange={(tab) => console.log('Tab changed:', tab)} />
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
    paddingBottom: 20,
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  badgeWrapper: {
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#FFC0CB',
    borderRadius: 20,
    paddingVertical: 10,
    width: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1.5,
  },
  cardWrapper: {
    marginBottom: 16,
  },
});

export default HomeAnime;
