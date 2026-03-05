import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getByStatus, getWishlist } from '../services/mediaStatusService';

import { useMediaType } from '../context/MediaTypeContext';
import { getPodiumListStyles, getPodiumPageTheme } from '../stylehandler/podiumPageStyles';

const STATUS_CONFIG = {
  watching: { icon: 'eye', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  watched:  { icon: 'checkmark-circle', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)' },
  dropped:  { icon: 'close-circle', color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  wishlist: { icon: 'bookmark', color: '#C084FC', bg: 'rgba(192,132,252,0.15)' },
};

const mediaDetailCache = {};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PodiumListPage = ({ route, navigation }) => {
  const { mediaType } = useMediaType();
  const styles = getPodiumListStyles(mediaType);
  const theme = getPodiumPageTheme(mediaType);

  // ─── Pull services + extractors from the theme ───────────
  const { fetchDetails, formatData } = theme.services;
  const { ListSkeleton } = theme.components;

  const { status } = route.params;
  const config = {
    ...(STATUS_CONFIG[status] || STATUS_CONFIG.watching),
    label: theme.statusLabels?.[status] || status,
  };
  const cachePrefix = theme.statusMediaType + '_';

  const [items, setItems] = useState([]);
  const [mediaDetails, setMediaDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(new Set());

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = status === 'wishlist'
        ? await getWishlist(theme.statusMediaType)
        : await getByStatus(status, theme.statusMediaType);

      if (result.success) {
        const data = result.data || [];
        setItems(data);

        // Pre-populate from cache
        const cached = {};
        data.forEach(item => {
          if (mediaDetailCache[cachePrefix + item.media_id]) {
            cached[item.media_id] = mediaDetailCache[cachePrefix + item.media_id];
          }
        });
        if (Object.keys(cached).length > 0) {
          setMediaDetails(prev => ({ ...prev, ...cached }));
        }
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, [status, theme.statusMediaType, cachePrefix]);

  // Lazy-load details — uses theme.services
  const fetchDetailForId = useCallback(async (mediaId) => {
    const cacheKey = cachePrefix + mediaId;
    if (mediaDetailCache[cacheKey] || fetchingRef.current.has(mediaId)) return;

    fetchingRef.current.add(mediaId);
    try {
      const result = await fetchDetails(mediaId);
      if (result) {
        const formatted = formatData(result);
        mediaDetailCache[cacheKey] = formatted;
        setMediaDetails(prev => ({ ...prev, [mediaId]: formatted }));
      }
      await delay(300);
    } catch (err) {
      console.warn(`Failed to fetch details for ${mediaId}:`, err.message);
    } finally {
      fetchingRef.current.delete(mediaId);
    }
  }, [fetchDetails, formatData, cachePrefix]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    viewableItems.forEach(({ item }) => {
      if (!mediaDetailCache[cachePrefix + item.media_id]) {
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

  // ─── Uses theme extractors: zero branching ───────────────
  const renderItem = useCallback(({ item }) => {
    const detail = mediaDetails[item.media_id];
    const title = theme.extractTitle(detail);
    const coverImage = theme.extractCover(detail);

    return (
      <Pressable
        style={styles.mediaCard}
        onPress={() => navigation.navigate(theme.detailsRoute, {
            animeId: item.media_id,
            gameId: item.media_id,
            gameName: theme.extractTitle(detail),
            coverImage: theme.extractCover(detail),
          })}
      >
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardPlaceholder}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" />
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.titleOverlay}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        </LinearGradient>
      </Pressable>
    );
  }, [mediaDetails, config, navigation, theme, styles]);

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </Pressable>
      <View style={[styles.statusHeaderBadge, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.statusHeaderText, { color: config.color }]}>{config.label}</Text>
      </View>
      <Text style={styles.countText}>{items.length} {theme.countLabel}</Text>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name={config.icon} size={64} color="rgba(255,255,255,0.1)" />
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptySubtitle}>{theme.emptyMessages[status]}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.background} />
        <ListSkeleton count={6} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
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

export default PodiumListPage;
