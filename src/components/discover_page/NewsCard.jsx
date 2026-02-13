import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo, fetchArticleImage } from '../../services/news_service';

const NewsCard = ({ article }) => {
  const [imageUrl, setImageUrl] = useState(article.image);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    // Fetch image when card becomes visible and doesn't have an image yet
    if (isVisible && !imageUrl && !isLoadingImage) {
      setIsLoadingImage(true);
      fetchArticleImage(article.link)
        .then(url => {
          if (url) setImageUrl(url);
        })
        .finally(() => setIsLoadingImage(false));
    }
  }, [isVisible, imageUrl, isLoadingImage, article.link]);

  const handlePress = () => {
    Linking.openURL(article.link);
  };

  const handleLayout = () => {
    // Mark as visible when card is rendered
    if (!isVisible) {
      setIsVisible(true);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={handlePress}
      onLayout={handleLayout}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : isLoadingImage ? (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={40} color="#444" />
        </View>
      ) : null}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {article.categories[0] || 'News'}
            </Text>
          </View>
          <Text style={styles.timeAgo}>
            {formatTimeAgo(article.publishedAt)}
          </Text>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
        
        <View style={styles.footer}>
          <Ionicons name="person-circle-outline" size={14} color="#888" />
          <Text style={styles.author}>{article.author}</Text>
          <Ionicons name="open-outline" size={12} color="#FFB3C6" style={styles.linkIcon} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#2A2A2A',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 179, 198, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Agdasima',
    color: '#FFB3C6',
    letterSpacing: 0.3,
  },
  timeAgo: {
    fontSize: 11,
    fontFamily: 'Agdasima',
    color: '#666',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    color: '#fff',
    letterSpacing: 0.3,
    lineHeight: 22,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  author: {
    fontSize: 12,
    fontFamily: 'Agdasima',
    color: '#888',
    flex: 1,
  },
  linkIcon: {
    marginLeft: 'auto',
  },
});

export default NewsCard;
