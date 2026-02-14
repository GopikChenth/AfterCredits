import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getAnimeNews } from '../services/news_service';
import NewsCard from '../components/discover_page/NewsCard';
import SkeletonNews from '../components/skeletons/SkeletonNews';

const NewsPage = ({ navigation }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      
      // Fetch only 30 articles total (3 pages)
      const allArticles = await getAnimeNews(30);
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
        <ActivityIndicator size="small" color="#FFB3C6" />
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <NewsCard article={item} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      
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
            <Text style={styles.headerTitle}>Anime News</Text>
            <Text style={styles.headerSubtitle}>Latest updates from Anime Corner</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Agdasima',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default NewsPage;