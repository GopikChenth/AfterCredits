import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMediaType } from '../context/MediaTypeContext';
import { getTrendingGames, getPopularGames, getNewReleases } from '../services/api_games';
import SideBar from '../components/home_page/SideBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GameHome = ({ navigation }) => {
  const { setMediaType } = useMediaType();
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('game');

  useEffect(() => {
    loadGames();
  }, [selectedCategory]);

  const loadGames = async () => {
    setLoading(true);
    try {
      let data;
      switch (selectedCategory) {
        case 'trending':
          data = await getTrendingGames(1, 10);
          break;
        case 'popular':
          data = await getPopularGames(1, 10);
          break;
        case 'new':
          data = await getNewReleases(1, 10);
          break;
        default:
          data = await getTrendingGames(1, 10);
      }
      setGames(data.results || []);
    } catch (error) {
      console.error('Error loading games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      
      {/* CRT Scanline Overlay */}
      <View style={styles.scanlineOverlay} pointerEvents="none" />
      
      {/* Animated Background Grid */}
      <View style={styles.gridBackground} pointerEvents="none">
        {[...Array(20)].map((_, i) => (
          <View key={i} style={styles.gridLine} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Retro Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.menuButton}
              onPress={() => setIsSidebarVisible(!isSidebarVisible)}
            >
              <LinearGradient
                colors={['#7C3AED', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.neonButton}
              >
                <Ionicons name="menu" size={24} color="#E2E8F0" />
              </LinearGradient>
            </Pressable>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>GAMES</Text>
              <View style={styles.titleGlow} />
            </View>

            <Pressable
              style={styles.profileButton}
              onPress={() => navigation.navigate('ProfilePage')}
            >
              <LinearGradient
                colors={['#F43F5E', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.neonButton}
              >
                <Ionicons name="person" size={24} color="#E2E8F0" />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Category Pills - Skeuomorphic Arcade Buttons */}
          <View style={styles.categoryContainer}>
            {['trending', 'popular', 'new'].map((category) => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={({ pressed }) => [
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                  pressed && styles.categoryButtonPressed,
                ]}
              >
                <LinearGradient
                  colors={
                    selectedCategory === category
                      ? ['#7C3AED', '#A78BFA']
                      : ['#1E1E3F', '#2A2A5A']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.categoryGradient}
                >
                  {/* Top Highlight */}
                  <View style={styles.categoryHighlight} />
                  
                  {/* Button Face */}
                  <View style={styles.categoryFace}>
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category && styles.categoryTextActive,
                      ]}
                    >
                      {category.toUpperCase()}
                    </Text>
                  </View>

                  {/* Neon Glow */}
                  {selectedCategory === category && (
                    <View style={styles.categoryGlow} />
                  )}
                </LinearGradient>
              </Pressable>
            ))}
          </View>

          {/* Featured Game - Holographic Card */}
          {!loading && games.length > 0 && (
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>FEATURED</Text>
              <Pressable
                style={styles.featuredCard}
                onPress={() => navigation.navigate('GameDetails', { gameId: games[0].id })}
              >
                <LinearGradient
                  colors={['#7C3AED20', '#F43F5E20']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featuredGradient}
                >
                  {/* Holographic Border */}
                  <View style={styles.holoBorder} />
                  
                  {/* Game Cover Image */}
                  {games[0].background_image && (
                    <Image
                      source={{ uri: games[0].background_image }}
                      style={styles.featuredImage}
                    />
                  )}
                  
                  {/* Dark overlay for text readability */}
                  <LinearGradient
                    colors={['transparent', 'rgba(15,15,35,0.7)', 'rgba(15,15,35,0.95)']}
                    style={styles.featuredImageOverlay}
                  />

                  <View style={styles.featuredContent}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {games[0].name}
                    </Text>
                    
                    {/* Metacritic Score Badge */}
                    {games[0].metacritic && (
                      <View style={styles.scoreBadge}>
                        <LinearGradient
                          colors={
                            games[0].metacritic >= 75
                              ? ['#10B981', '#059669']
                              : games[0].metacritic >= 50
                              ? ['#FFBE0B', '#F59E0B']
                              : ['#EF4444', '#DC2626']
                          }
                          style={styles.scoreGradient}
                        >
                          <Text style={styles.scoreText}>{games[0].metacritic}</Text>
                        </LinearGradient>
                      </View>
                    )}

                    {/* Platform Badges */}
                    <View style={styles.platformRow}>
                      {games[0].platforms?.slice(0, 3).map((p, idx) => (
                        <View key={idx} style={styles.platformBadge}>
                          <Text style={styles.platformText}>
                            {p.platform.name.substring(0, 3).toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Game Grid - Arcade Cabinet Style */}
          <View style={styles.gridSection}>
            <Text style={styles.sectionTitle}>
              {selectedCategory.toUpperCase()} GAMES
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.loadingText}>LOADING...</Text>
              </View>
            ) : (
              <View style={styles.gameGrid}>
                {games.slice(1).map((game, index) => (
                  <Pressable
                    key={game.id}
                    style={({ pressed }) => [
                      styles.gameCard,
                      pressed && styles.gameCardPressed,
                    ]}
                    onPress={() => navigation.navigate('GameDetails', { gameId: game.id })}
                  >
                    <LinearGradient
                      colors={['#1E1E3F', '#2A2A5A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.cardGradient}
                    >
                      {/* Arcade Screen Bezel */}
                      <View style={styles.cardBezel}>
                        {/* Game Cover Image */}
                        {game.background_image && (
                          <Image
                            source={{ uri: game.background_image }}
                            style={styles.cardImage}
                          />
                        )}
                        
                        {/* Gradient overlay for text readability */}
                        <LinearGradient
                          colors={['transparent', 'rgba(15,15,35,0.85)', 'rgba(15,15,35,0.98)']}
                          style={styles.cardImageOverlay}
                        />
                        
                        {/* Game Info */}
                        <View style={styles.cardContent}>
                          <Text style={styles.cardTitle} numberOfLines={2}>
                            {game.name}
                          </Text>

                          {/* Rating Stars */}
                          <View style={styles.ratingRow}>
                            {[...Array(5)].map((_, i) => (
                              <Ionicons
                                key={i}
                                name={i < Math.round(game.rating) ? 'star' : 'star-outline'}
                                size={12}
                                color="#FFBE0B"
                              />
                            ))}
                          </View>

                          {/* Metacritic Mini Badge */}
                          {game.metacritic && (
                            <View style={styles.miniScoreBadge}>
                              <Text style={styles.miniScoreText}>
                                {game.metacritic}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Neon Accent Line */}
                        <View style={styles.cardAccent} />
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

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
    backgroundColor: '#0F0F23',
  },
  scanlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.05,
    zIndex: 999,
  },
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#7C3AED',
    marginVertical: 40,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuButton: {
    width: 48,
    height: 48,
  },
  profileButton: {
    width: 48,
    height: 48,
  },
  neonButton: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  titleContainer: {
    position: 'relative',
  },
  title: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '900',
    color: '#E2E8F0',
    letterSpacing: 4,
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#7C3AED',
    opacity: 0.3,
    borderRadius: 8,
    transform: [{ scaleX: 1.1 }, { scaleY: 1.5 }],
  },

  // Category Pills - Arcade Buttons
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  categoryButton: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryButtonActive: {
    transform: [{ translateY: 2 }],
  },
  categoryButtonPressed: {
    transform: [{ translateY: 4 }],
  },
  categoryGradient: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#7C3AED40',
  },
  categoryHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#FFFFFF20',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  categoryFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 2,
  },
  categoryTextActive: {
    color: '#E2E8F0',
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  categoryGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },

  // Featured Section
  featuredSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '900',
    color: '#E2E8F0',
    letterSpacing: 3,
    marginBottom: 16,
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  featuredCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredGradient: {
    flex: 1,
    padding: 3,
  },
  holoBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  featuredImage: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 13,
  },
  featuredImageOverlay: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 13,
  },
  featuredContent: {
    flex: 1,
    borderRadius: 13,
    padding: 20,
    justifyContent: 'space-between',
  },
  featuredTitle: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '900',
    color: '#E2E8F0',
    letterSpacing: 1,
  },
  scoreBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  scoreGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F0F23',
  },
  scoreText: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  platformRow: {
    flexDirection: 'row',
    gap: 8,
  },
  platformBadge: {
    backgroundColor: '#7C3AED40',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  platformText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 1,
  },

  // Game Grid
  gridSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 3,
    marginTop: 16,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gameCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gameCardPressed: {
    transform: [{ scale: 0.95 }],
  },
  cardGradient: {
    flex: 1,
    padding: 4,
  },
  cardBezel: {
    flex: 1,
    backgroundColor: '#0F0F23',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  cardImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#00000040',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  miniScoreBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniScoreText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});

export default GameHome;
