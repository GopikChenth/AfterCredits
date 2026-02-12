import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getUpcomingAnime, formatAnimeData } from '../services/api_anime';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.32;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

const DiscoverPage = ({ navigation }) => {
  const [upcomingAnime, setUpcomingAnime] = useState([]);
  const [loading, setLoading] = useState(true);

  // Season order for sorting (earliest first)
  const SEASON_ORDER = { WINTER: 0, SPRING: 1, SUMMER: 2, FALL: 3 };

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    try {
      setLoading(true);
      const result = await getUpcomingAnime(1, 20);
      if (result?.media) {
        const formatted = result.media.map(formatAnimeData);
        // Sort by nearest release: year first, then season order
        const sorted = formatted.sort((a, b) => {
          const yearA = a.year || 9999;
          const yearB = b.year || 9999;
          if (yearA !== yearB) return yearA - yearB;
          const seasonA = SEASON_ORDER[a.season] ?? 99;
          const seasonB = SEASON_ORDER[b.season] ?? 99;
          return seasonA - seasonB;
        });
        setUpcomingAnime(sorted);
      }
    } catch (error) {
      console.error('Error fetching upcoming anime:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (anime) => {
    if (anime.season && anime.year) {
      return `${anime.season} ${anime.year}`;
    }
    if (anime.year) return `${anime.year}`;
    return 'TBA';
  };

  const renderUpcomingCard = (anime) => (
    <TouchableOpacity
      key={anime.id}
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('DetailsAnime', { animeId: anime.id })}
    >
      <Image
        source={{ uri: anime.coverImage }}
        style={styles.cardImage}
      />
      {/* Title overlay on image */}
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={2}>{anime.title}</Text>
        <View style={styles.releaseBadge}>
          <Ionicons name="calendar-outline" size={9} color="#FFB3C6" />
          <Text style={styles.releaseText}>{formatDate(anime)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      
      <View style={styles.container}>
        {/* Header — matches Post & Podium */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Explore anime, find your next obsession</Text>
        </View>

        {/* Upcoming Anime Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLeft}>
              <Ionicons name="time-outline" size={20} color="#FFB3C6" />
              <Text style={styles.sectionTitle}>Coming Soon</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('UpcomingPage')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFB3C6" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Anime that are yet to release</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFB3C6" />
            <Text style={styles.loadingText}>Loading upcoming anime...</Text>
          </View>
        ) : (
          <FlatList
            data={upcomingAnime}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => renderUpcomingCard(item)}
            style={styles.flatList}
          />
        )}
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  // Header — identical to Post & Podium
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'Agdasima',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 10,
  },
  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    color: '#fff',
    letterSpacing: 0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 179, 198, 0.1)',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Agdasima',
    color: '#FFB3C6',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Agdasima',
    color: '#666',
    letterSpacing: 0.3,
    marginTop: 4,
    marginLeft: 28,
  },
  // Horizontal scroll
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 14,
    alignItems: 'flex-start',
  },
  flatList: {
    flexGrow: 0,
  },
  // Card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    paddingTop: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    color: '#fff',
    letterSpacing: 0.3,
    lineHeight: 17,
  },
  releaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 4,
  },
  releaseText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Agdasima',
    color: '#FFB3C6',
    letterSpacing: 0.3,
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
  },
});

export default DiscoverPage;
