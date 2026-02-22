import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useMediaType } from '../context/MediaTypeContext';
import { getAnimeNews } from '../services/news_service';
import { getGamingNews } from '../services/news_games';
import NewsCard from '../components/discover_page/NewsCard';
import SkeletonNews from '../components/skeletons/SkeletonNews';
import { getNewsPageStyles, getNewsPageTheme } from '../stylehandler/newsPageStyles';

const NewsPage = ({ navigation }) => {
  const { mediaType } = useMediaType();
  const styles = getNewsPageStyles(mediaType);
  const theme = getNewsPageTheme(mediaType);

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setNews([]);
    setPage(1);
    setHasMore(true);
    fetchNews(1);
  }, [mediaType]);

  const PAGE_SIZE = 15;

  const fetchNews = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);

      // Fetch enough articles to satisfy this page by asking for progressively more
      const totalNeeded = pageNum * PAGE_SIZE;
      let allArticles;
      if (mediaType === 'games') {
        allArticles = await getGamingNews(totalNeeded + PAGE_SIZE); // always fetch 1 extra page
      } else {
        allArticles = await getAnimeNews(totalNeeded + PAGE_SIZE);
      }

      const startIndex = (pageNum - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const pageArticles = allArticles.slice(startIndex, endIndex);

      if (pageNum === 1) {
        setNews(pageArticles);
      } else {
        setNews(prev => [...prev, ...pageArticles]);
      }

      // has more if we got a full page AND there are articles beyond this page
      setHasMore(pageArticles.length >= PAGE_SIZE && allArticles.length > endIndex);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNews(nextPage);
    }
  };

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <NewsCard article={item} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{theme.headerTitle}</Text>
            <Text style={styles.headerSubtitle}>{theme.headerSubtitle}</Text>
          </View>
        </View>

        {loading && page === 1 ? (
          <SkeletonNews count={4} />
        ) : (
          <FlatList
            data={news}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default NewsPage;