import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 10;
const NUM_COLUMNS = 4;
const COVER_WIDTH = (SCREEN_WIDTH - (GRID_PADDING * 2) - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;
const COVER_HEIGHT = COVER_WIDTH * 1.5;

const PostDetailPage = ({ route, navigation }) => {
  const { post } = route.params;
  const [imageErrors, setImageErrors] = useState({});

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(post.username || 'user')}`;
  const displayAvatar = post.avatarUrl || defaultAvatar;

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Build rows of 4 for the grid
  const gridRows = [];
  const validCovers = post.animeCovers.filter((_, i) => !imageErrors[i]);
  for (let i = 0; i < validCovers.length; i += NUM_COLUMNS) {
    gridRows.push(validCovers.slice(i, i + NUM_COLUMNS));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* Back Button */}
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Avatar + Username + Date */}
        <View style={styles.header}>
          <Image
            source={{ uri: displayAvatar }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.date}>{post.date}</Text>
        </View>

        {/* Post Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Description */}
        {post.description && (
          <Text style={styles.description}>{post.description}</Text>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Anime Grid - 4 columns */}
        <View style={styles.grid}>
          {post.animeCovers.map((cover, index) => (
            !imageErrors[index] && (
              <Image
                key={index}
                source={{ uri: cover.imageUrl }}
                style={styles.gridImage}
                onError={() => handleImageError(index)}
              />
            )
          ))}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GRID_PADDING,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2A2A2A',
  },
  username: {
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#fff',
    flex: 1,
  },
  date: {
    fontSize: 14,
    fontFamily: 'Agdasima',
    color: '#666',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Agdasima-Bold',
    color: '#fff',
    lineHeight: 28,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Agdasima',
    color: '#999',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridImage: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
  },
});

export default PostDetailPage;