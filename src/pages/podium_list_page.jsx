import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getByStatus, getWishlist } from '../services/mediaStatusService';
import { getAnimeDetails, formatAnimeData } from '../services/api_anime';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

const STATUS_CONFIG = {
  watching: { label: 'Watching', icon: 'eye', color: '#FFF3B0', textColor: '#7A6B00', borderColor: '#F0E68C' },
  watched: { label: 'Watched', icon: 'checkmark-circle', color: '#B5EAD7', textColor: '#1B6B3A', borderColor: '#8FD4B4' },
  dropped: { label: 'Dropped', icon: 'close-circle', color: '#FFB5B5', textColor: '#8B1A1A', borderColor: '#F09090' },
  wishlist: { label: 'Wishlist', icon: 'bookmark', color: '#D4BBFF', textColor: '#5B2D8E', borderColor: '#B89AE8' },
};

// Simple in-memory cache for anime details
const animeCache = {};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PodiumListPage = ({ navigation, route }) => {
  const { status } = route.params;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.watching;

  const [items, setItems] = useState([]);
  const [animeDetails, setAnimeDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnimeDetailsForItems = useCallback(async (statusItems) => {
    const cached = {};
    statusItems.forEach(item => {
      if (animeCache[item.media_id]) {
        cached[item.media_id] = animeCache[item.media_id];
      }
    });
    if (Object.keys(cached).length > 0) {
      setAnimeDetails(prev => ({ ...prev, ...cached }));
    }

    const uncachedIds = statusItems
      .map(item => item.media_id)
      .filter(id => !animeCache[id]);

    for (const id of uncachedIds) {
      try {
        const result = await getAnimeDetails(parseInt(id));
        if (result) {
          const formatted = formatAnimeData(result);
          animeCache[id] = formatted;
          setAnimeDetails(prev => ({ ...prev, [id]: formatted }));
        }
        if (uncachedIds.indexOf(id) < uncachedIds.length - 1) {
          await delay(400);
        }
      } catch (error) {
        console.warn(`Failed to fetch details for ${id}:`, error.message);
        const fallback = { id, title: `Anime #${id}`, coverImage: null };
        animeCache[id] = fallback;
        setAnimeDetails(prev => ({ ...prev, [id]: fallback }));
      }
    }
  }, []);

  const fetchItems = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      let result;
      if (status === 'wishlist') {
        result = await getWishlist('anime');
      } else {
        result = await getByStatus(status, 'anime');
      }

      if (result.success) {
        const data = result.data || [];
        setItems(data);
        if (data.length > 0) {
          fetchAnimeDetailsForItems(data);
        }
      }
    } catch (error) {
      console.error('Error fetching list items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, fetchAnimeDetailsForItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems(true);
  };

  const renderItem = (item) => {
    const anime = animeDetails[item.media_id];
    const title = anime?.title || 'Loading...';
    const coverImage = anime?.coverImage;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.animeCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DetailsAnime', { animeId: item.media_id })}
      >
        <View style={styles.cardImageContainer}>
          {coverImage ? (
            <Image
              source={{ uri: coverImage }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cardPlaceholder}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" />
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          {anime?.score && (
            <View style={styles.scoreBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.scoreText}>{anime.score}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <Ionicons name={config.icon} size={22} color={config.color} />
            <Text style={[styles.headerTitle, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {items.length} {items.length === 1 ? 'anime' : 'anime'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={[config.color]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={config.color} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name={config.icon} size={64} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              {status === 'watching' && 'Start watching anime and mark them here'}
              {status === 'watched' && 'Mark anime as watched to track your history'}
              {status === 'dropped' && "Anime you've dropped will appear here"}
              {status === 'wishlist' && 'Add anime to your wishlist from the details page'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {items.map(renderItem)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Agdasima',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Agdasima',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
  },
  animeCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardImageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.4,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#252540',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  cardInfo: {
    padding: 10,
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
    lineHeight: 17,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    fontFamily: 'Agdasima',
  },
});

export default PodiumListPage;
