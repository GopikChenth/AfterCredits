import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
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
import DateSelector from '../components/review_page/DateSelector';
import { submitReview, getUserReview } from '../services/reviewService';
import { useMediaType } from '../context/MediaTypeContext';
import { getReviewPageStyles, getReviewPageTheme } from '../stylehandler/reviewPageStyles';

const ReviewPage = ({ navigation, route }) => {
  const { mediaType } = useMediaType();
  const activeMediaType = route?.params?.mediaType || mediaType;
  const styles = getReviewPageStyles(activeMediaType);
  const theme = getReviewPageTheme(activeMediaType);

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
      Alert.alert('Rating Required', theme.ratingLabel);
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Review Required', 'Please write a review.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare review data
      const reviewData = {
        mediaType: theme.mediaTypeKey,
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
            <Pressable onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>{theme.headerText}</Text>
            <Pressable onPress={handleSave} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="checkmark" size={28} color={theme.accent} />
            </Pressable>
          </View>

          {/* Media Info */}
          <View style={styles.mediaRow}>
            <Image 
              source={{ uri: coverImage }} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <Text style={styles.mediaTitle}>{title}</Text>
          </View>

          <View style={styles.divider} />

          {/* Date Row */}
          <DateSelector date={date} onDateChange={setDate} mediaType={activeMediaType} />

          <View style={styles.divider} />

          {/* Rating & Like */}
          <View style={styles.interactionRow}>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setRating(star)}>
                    <Ionicons 
                      name="star" 
                      size={32} 
                      color={star <= rating ? theme.accent : theme.inactiveStar} 
                      style={{ marginRight: 6 }}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.smallLabel}>Rate</Text>
            </View>

            <View style={styles.likeContainer}>
              <Pressable onPress={() => setLiked(!liked)}>
                <Ionicons 
                  name={liked ? "heart" : "heart"} 
                  size={32} 
                  color={liked ? theme.accent : theme.inactiveStar} 
                />
              </Pressable>
              <Text style={styles.smallLabel}>Like</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Review Input */}
          <TextInput
            style={styles.reviewInput}
            placeholder="Add review..."
            placeholderTextColor="#999"
            multiline
            value={reviewText}
            onChangeText={setReviewText}
            textAlignVertical="top"
          />

          {/* Tags */}
          <Pressable style={styles.tagsContainer}>
            <Text style={styles.tagsPlaceholder}>Add tags...</Text>
          </Pressable>

          <View style={styles.divider} />

          {/* Bottom Toggles */}
          <View style={styles.togglesRow}>
            <Pressable 
              style={styles.toggleItem} 
              onPress={() => setIsFirstTime(!isFirstTime)}
            >
              <View style={[styles.iconCircle, isFirstTime && { borderColor: theme.accent, backgroundColor: theme.accent + '20' }]}>
                <Ionicons name="eye-outline" size={24} color={isFirstTime ? theme.accent : '#ccc'} />
              </View>
              <Text style={[styles.toggleText, isFirstTime && { color: theme.accent }]}>
                First-time watch
              </Text>
            </Pressable>

            <Pressable 
              style={styles.toggleItem} 
              onPress={() => setNoSpoilers(!noSpoilers)}
            >
              <View style={[styles.iconCircle, noSpoilers && { borderColor: theme.accent, backgroundColor: theme.accent + '20' }]}>
                <Ionicons name="eye-off-outline" size={24} color={noSpoilers ? theme.accent : '#ccc'} /> 
              </View>
              <Text style={[styles.toggleText, noSpoilers && { color: theme.accent }]}>
                No spoilers
              </Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ReviewPage;
