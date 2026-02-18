import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo, fetchArticleImage } from '../../services/news_service';
import { useMediaType } from '../../context/MediaTypeContext';
import { getDiscoverStyles } from '../../stylehandler/discoverStyles';

/**
 * NewsCard — Displays a single news article in a horizontal card layout.
 * Used on both the Discover page preview and the full News page.
 *
 * Styles are driven by the current mediaType via discoverStyles.
 *
 * Expected `article` shape:
 *   { id, title, link, author, publishedAt, description, categories, image }
 */
const NewsCard = ({ article }) => {
  const { mediaType } = useMediaType();
  const styles = getDiscoverStyles(mediaType);

  const [imageUri, setImageUri] = useState(article.image || null);

  // If no image was embedded in the RSS, try fetching the OG image
  useEffect(() => {
    if (!imageUri && article.link) {
      fetchArticleImage(article.link).then((uri) => {
        if (uri) setImageUri(uri);
      });
    }
  }, [article.link]);

  const handlePress = () => {
    if (article.link) {
      Linking.openURL(article.link).catch(() => {});
    }
  };

  const timeAgo = article.publishedAt
    ? formatTimeAgo(new Date(article.publishedAt))
    : '';

  return (
    <Pressable style={styles.newsCard} onPress={handlePress}>
      {/* Thumbnail */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.newsImage} />
      ) : (
        <View style={styles.newsImagePlaceholder}>
          <Ionicons name="image-outline" size={28} color="#555" />
        </View>
      )}

      {/* Text content */}
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {article.title}
        </Text>

        {article.description ? (
          <Text style={styles.newsDescription} numberOfLines={2}>
            {article.description}
          </Text>
        ) : null}

        <View style={styles.newsMeta}>
          {article.author ? (
            <Text style={styles.newsMetaText} numberOfLines={1}>
              {article.author}
            </Text>
          ) : null}
          {timeAgo ? (
            <Text style={styles.newsMetaText}> · {timeAgo}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

export default NewsCard;
