import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMediaTheme } from '../utils/mediaThemes';
import DateSelector from '../components/review_page/DateSelector';
import { submitReview, getUserReview } from '../services/reviewService';

const ReviewAnime = ({ navigation, route }) => {
  const theme = getMediaTheme('anime');
  // Fallback data if not passed or missing
  const { 
    title = 'Unknown Title', 
    coverImage = 'https://via.placeholder.com/150',
    id,
    animeId 
  } = route?.params || {};

  const mediaId = animeId || id;

  // Base review states
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [noSpoilers, setNoSpoilers] = useState(false);
  const [date, setDate] = useState(new Date());

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    // Validation
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please rate the anime before submitting.');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Review Required', 'Please write a review.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare review data (simplified - no detailed ratings)
      const reviewData = {
        mediaType: 'anime',
        mediaId: mediaId,
        overallRating: rating * 2, // Convert 1-5 stars to 1-10
        content: reviewText.trim(),
        isSpoiler: !noSpoilers, // Invert the "no spoilers" checkbox
      };

      // Submit to database
      const result = await submitReview(reviewData);

      if (result.success) {
        Alert.alert(
          'Success!', 
          'Your review has been submitted.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontFamily: theme.headingFont }]}>I Watched</Text>
            <TouchableOpacity onPress={handleSave} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="checkmark" size={28} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {/* Media Info */}
          <View style={styles.mediaRow}>
            <Image 
              source={{ uri: coverImage }} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <Text style={[styles.mediaTitle, { fontFamily: theme.headingFont }]}>{title}</Text>
          </View>

          <View style={styles.divider} />

          {/* Date Row */}
          <DateSelector date={date} onDateChange={setDate} />

          <View style={styles.divider} />

          {/* Rating & Like */}
          <View style={styles.interactionRow}>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                    <Ionicons 
                      name="star" 
                      size={32} 
                      color={star <= rating ? theme.accent : '#E0E0E0'} 
                      style={{ marginRight: 6 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.smallLabel, { fontFamily: theme.contentFont }]}>Rate</Text>
            </View>

            <View style={styles.likeContainer}>
              <TouchableOpacity onPress={() => setLiked(!liked)} activeOpacity={0.7}>
                <Ionicons 
                  name={liked ? "heart" : "heart"} 
                  size={32} 
                  color={liked ? theme.accent : '#E0E0E0'} 
                />
              </TouchableOpacity>
              <Text style={[styles.smallLabel, { fontFamily: theme.contentFont }]}>Like</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Review Input */}
          <TextInput
            style={[styles.reviewInput, { fontFamily: theme.contentFont }]}
            placeholder="Add review..."
            placeholderTextColor="#999"
            multiline
            value={reviewText}
            onChangeText={setReviewText}
            textAlignVertical="top"
          />

          {/* Tags */}
          <TouchableOpacity style={styles.tagsContainer} activeOpacity={0.7}>
            <Text style={[styles.tagsPlaceholder, { fontFamily: theme.contentFont }]}>Add tags...</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Bottom Toggles */}
          <View style={styles.togglesRow}>
            <TouchableOpacity 
              style={styles.toggleItem} 
              onPress={() => setIsFirstTime(!isFirstTime)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, isFirstTime && { borderColor: theme.accent, backgroundColor: theme.accent + '20' }]}>
                <Ionicons name="eye-outline" size={24} color={isFirstTime ? theme.accent : '#ccc'} />
              </View>
              <Text style={[styles.toggleText, { fontFamily: theme.contentFont }, isFirstTime && { color: theme.accent }]}>
                First-time watch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toggleItem} 
              onPress={() => setNoSpoilers(!noSpoilers)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, noSpoilers && { borderColor: theme.accent, backgroundColor: theme.accent + '20' }]}>
                <Ionicons name="eye-off-outline" size={24} color={noSpoilers ? theme.accent : '#ccc'} /> 
              </View>
              <Text style={[styles.toggleText, { fontFamily: theme.contentFont }, noSpoilers && { color: theme.accent }]}>
                No spoilers
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  thumbnail: {
    width: 40,
    height: 60,
    borderRadius: 6,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  mediaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#595959',
    marginHorizontal: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  dateValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateValue: {
    fontSize: 16,
    color: '#333',
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30, // More padding to center controls better
    paddingVertical: 20,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  likeContainer: {
    alignItems: 'center',
  },
  smallLabel: {
    fontSize: 12,
    color: '#999',
  },
  reviewInput: {
    flex: 1,
    minHeight: 150,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#1a1a1a', // Or slightly off-white '#FAFAFA'
  },
  tagsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tagsPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  togglesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  toggleItem: {
    alignItems: 'center',
    width: 120,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});

export default ReviewAnime;
