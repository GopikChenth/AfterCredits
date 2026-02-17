import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Linking,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo, fetchArticleImage } from '../../services/news_service';

/**
 * NewsCard — Displays a single news article in a horizontal card layout.
 * Used on both the Discover page preview and the full News page.
 *
 * Expected `article` shape:
 *   { id, title, link, author, publishedAt, description, categories, image }
 */
const NewsCard = ({ article }) => {
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
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Thumbnail */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={28} color="#555" />
        </View>
      )}

      {/* Text content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>

        {article.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {article.description}
          </Text>
        ) : null}

        <View style={styles.meta}>
          {article.author ? (
            <Text style={styles.metaText} numberOfLines={1}>
              {article.author}
            </Text>
          ) : null}
          {timeAgo ? (
            <Text style={styles.metaText}> · {timeAgo}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  image: {
    width: 100,
    height: 90,
  },
  imagePlaceholder: {
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  description: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#666',
    letterSpacing: 0.2,
  },
});

export default NewsCard;
