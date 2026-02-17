import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo, fetchArticleImage } from '../../services/news_service';
import { useMediaType } from '../../context/MediaTypeContext';
import { getDiscoverStyles, getDiscoverTheme } from '../../stylehandler/discoverStyles';

const NewsCard = ({ article }) => {
  const { mediaType } = useMediaType();
  const styles = getDiscoverStyles(mediaType);
  const theme = getDiscoverTheme(mediaType);

  const [imageUrl, setImageUrl] = useState(article.image);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    // Fetch image when card becomes visible and doesn't have an image yet
    if (isVisible && !imageUrl && !isLoadingImage) {
      if (article.image) return; // If image is already provided in article object

      setIsLoadingImage(true);
      fetchArticleImage(article.link)
        .then(url => {
          if (url) setImageUrl(url);
        })
        .finally(() => setIsLoadingImage(false));
    }
  }, [isVisible, imageUrl, isLoadingImage, article.link, article.image]);

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
    <Pressable
      style={styles.newsCard}
      onPress={handlePress}
      onLayout={handleLayout}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.newsImage}
          resizeMode="cover"
        />
      ) : isLoadingImage ? (
        <View style={styles.newsImagePlaceholder}>
          <Ionicons name="image-outline" size={40} color="#444" />
        </View>
      ) : null}
      <View style={styles.newsContent}>
        <View style={styles.newsHeader}>
          <View style={styles.newsCategoryBadge}>
            <Text style={styles.newsCategoryText}>
              {article.categories[0] || 'News'}
            </Text>
          </View>
          <Text style={styles.newsTimeAgo}>
            {formatTimeAgo(article.publishedAt)}
          </Text>
        </View>
        
        <Text style={styles.newsTitle} numberOfLines={2}>
          {article.title}
        </Text>
        
        <View style={styles.newsFooter}>
          <Ionicons name="person-circle-outline" size={14} color="#888" />
          <Text style={styles.newsAuthor}>{article.author}</Text>
          <Ionicons name="open-outline" size={12} color={theme.accent} style={styles.newsLinkIcon} />
        </View>
      </View>
    </Pressable>
  );
};

export default NewsCard;