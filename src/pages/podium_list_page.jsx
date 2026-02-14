import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getByStatus, getWishlist } from '../services/mediaStatusService';
import { getAnimeDetails, formatAnimeData } from '../services/api_anime';
import SkeletonPodiumList from '../components/skeletons/SkeletonPodiumList';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

const STATUS_CONFIG = {
  watching: { label: 'Watching', icon: 'eye', color: '#FBBF24', textColor: '#fff', bg: 'rgba(251,191,36,0.15)' },
  watched: { label: 'Completed', icon: 'checkmark-circle', color: '#4ADE80', textColor: '#fff', bg: 'rgba(74,222,128,0.15)' },
  dropped: { label: 'Dropped', icon: 'close-circle', color: '#F87171', textColor: '#fff', bg: 'rgba(248,113,113,0.15)' },
  wishlist: { label: 'Wishlist', icon: 'bookmark', color: '#C084FC', textColor: '#fff', bg: 'rgba(192,132,252,0.15)' },
};

const animeCache = {};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PodiumListPage = ({ route, navigation }) => {
  const { status } = route.params;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.watching;

  const [items, setItems] = useState([]);
  const [animeDetails, setAnimeDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(new Set());

  const fetchItems = useCallback(async () => {
    setLoading(true);
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

        // Pre-populate from cache only
        const cached = {};
        data.forEach(item => {
          if (animeCache[item.media_id]) {
            cached[item.media_id] = animeCache[item.media_id];
          }
        });
        if (Object.keys(cached).length > 0) {
          setAnimeDetails(prev => ({ ...prev, ...cached }));
        }
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Lazy-load details for a single media_id
  const fetchDetailForId = useCallback(async (mediaId) => {
    if (animeCache[mediaId] || fetchingRef.current.has(mediaId)) return;

    fetchingRef.current.add(mediaId);
    try {
      const result = await getAnimeDetails(parseInt(mediaId));
      if (result) {
        const formatted = formatAnimeData(result);
        animeCache[mediaId] = formatted;
        setAnimeDetails(prev => ({ ...prev, [mediaId]: formatted }));
      }
      await delay(300);
    } catch (err) {
      console.warn(`Failed to fetch details for ${mediaId}:`, err.message);
    } finally {
      fetchingRef.current.delete(mediaId);
    }
  }, []);

  // Called when visible items change — triggers lazy fetching
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    viewableItems.forEach(({ item }) => {
      if (!animeCache[item.media_id]) {
        fetchDetailForId(item.media_id);
      }
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
    minimumViewTime: 100,
  }).current;

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const renderItem = useCallback(({ item }) => {
    const anime = animeDetails[item.media_id];
    const title = anime?.title || 'Loading...';
    const coverImage = anime?.coverImage;

    return (
      <Pressable
        style={styles.animeCard}
        onPress={() => navigation.navigate('DetailsAnime', { animeId: item.media_id })}
      >
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
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.titleOverlay}
        >
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        </LinearGradient>
      </Pressable>
    );
  }, [animeDetails, config, navigation]);

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </Pressable>
      <View style={[styles.statusHeaderBadge, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.statusHeaderText, { color: config.color }]}>{config.label}</Text>
      </View>
      <Text style={styles.countText}>{items.length} anime</Text>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name={config.icon} size={64} color="rgba(255,255,255,0.1)" />
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptySubtitle}>
        {status === 'watching' && 'Start watching anime and mark them here'}
        {status === 'watched' && 'Mark anime as watched to track your history'}
        {status === 'dropped' && "Anime you've dropped will appear here"}
        {status === 'wishlist' && 'Add anime to your wishlist from the details page'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SkeletonPodiumList count={6} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString() || item.media_id?.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<EmptyState />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Header
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  statusHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  countText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: '#888',
    fontFamily: 'Agdasima',
  },

  // Cards
  animeCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    zIndex: 2,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 30,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
    lineHeight: 17,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default PodiumListPage;
