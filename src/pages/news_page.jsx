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

  const fetchNews = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);

      let allArticles;
      if (mediaType === 'games') {
        allArticles = await getGamingNews(30);
      } else {
        allArticles = await getAnimeNews(30);
      }

      const startIndex = (pageNum - 1) * 10;
      const endIndex = startIndex + 10;
      const pageArticles = allArticles.slice(startIndex, endIndex);

      if (pageNum === 1) {
        setNews(pageArticles);
      } else {
        setNews(prev => [...prev, ...pageArticles]);
      }

      setHasMore(endIndex < allArticles.length);
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