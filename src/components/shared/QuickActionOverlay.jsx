import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getMediaStatus } from '../../services/mediaStatusService';

const ACCENT = '#A78BFA';
const ACCENT_DIM = 'rgba(167, 139, 250, 0.15)';
const ACCENT_BORDER = 'rgba(167, 139, 250, 0.3)';
const CARD_BG = '#252525';
const ACTION_BG = '#1A1A1A';
const TEXT_PRIMARY = '#FFFFFF';
const YELLOW_ACCENT = '#FBBF24';
const YELLOW_DIM = 'rgba(251, 191, 36, 0.18)';
const YELLOW_BORDER = 'rgba(251, 191, 36, 0.5)';
const GREEN_ACCENT = '#4ADE80';
const GREEN_DIM = 'rgba(74, 222, 128, 0.18)';
const GREEN_BORDER = 'rgba(74, 222, 128, 0.5)';
const PURPLE_ACCENT = '#C084FC';
const PURPLE_DIM = 'rgba(192, 132, 252, 0.18)';
const PURPLE_BORDER = 'rgba(192, 132, 252, 0.5)';

const { width: SCREEN_W } = Dimensions.get('window');
const ACTION_BTN_W = 56;
const ACTION_GAP = 12;

const QuickActionOverlay = memo(({
  visible,
  onClose,
  media,
  mediaType = 'anime',
  cardLayout,
  cardHeight,
  isLeftColumn,
  onWishlist,
  onCompleted,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Local state for toggles
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    if (visible && media) {
      fadeAnim.setValue(0);
      slideAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 260,
          friction: 20,
          useNativeDriver: true,
        }),
      ]).start();

      // Fetch actual status
      getMediaStatus(mediaType, media.id).then(res => {
        if (active && res?.success && res.data) {
          setIsWishlisted(res.data.is_wishlisted);
          setIsPlaying(res.data.status === 'watching');
          setIsCompleted(res.data.status === 'watched');
        }
      });
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(0);
      setIsWishlisted(false);
      setIsPlaying(false);
      setIsCompleted(false);
    }
    return () => { active = false; };
  }, [visible, media, mediaType, fadeAnim, slideAnim]);

  const handleWishlistPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !isWishlisted;
    setIsWishlisted(newVal);
    onWishlist(media, newVal);
  };

  const handleCompletedPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !isCompleted;
    setIsPlaying(false);
    setIsCompleted(newVal);
    onCompleted(media, newVal ? 'watched' : null);
  };

  const handlePlayingPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !isPlaying;
    setIsPlaying(newVal);
    setIsCompleted(false);
    onCompleted(media, newVal ? 'watching' : null);
  };

  if (!visible || !media || !cardLayout) return null;

  // Calculate action button positions
  const actionSlideFrom = isLeftColumn ? 30 : -30;
  const actionTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [actionSlideFrom, 0],
  });

  let actionsStyle;
  const actionsTopOffset = 72;
  if (isLeftColumn) {
    // Card is on the left → actions on the right
    actionsStyle = {
      position: 'absolute',
      left: cardLayout.x + cardLayout.width + ACTION_GAP,
      top: cardLayout.y + (cardLayout.height / 2) - actionsTopOffset,
    };
  } else {
    // Card is on the right → actions on the left
    actionsStyle = {
      position: 'absolute',
      right: (SCREEN_W - cardLayout.x) + ACTION_GAP,
      top: cardLayout.y + (cardLayout.height / 2) - actionsTopOffset,
    };
  }

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Dark backdrop — tap to dismiss */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Ghost card — re-rendered at exact screen position */}
      <Animated.View
        style={[
          styles.ghostCard,
          // Remove background/border for movies and games
          (mediaType === 'movies' || mediaType === 'games') && styles.ghostCardNoBorder,
          {
            position: 'absolute',
            left: cardLayout.x,
            top: cardLayout.y,
            width: cardLayout.width,
            height: cardLayout.height,
            opacity: fadeAnim,
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.ghostCardInner}>
          <Image
            source={{ uri: media.coverImage || media.background_image }}
            style={styles.ghostImage}
            contentFit="cover"
          />
          <View style={styles.ghostOverlay} />
          <View style={styles.ghostContent}>
            <Text style={styles.ghostTitle} numberOfLines={2}>
              {media.title || media.name}
            </Text>
            {media.year ? <Text style={styles.ghostYear}>{media.year}</Text> : null}
          </View>
        </View>
      </Animated.View>

      {/* Action buttons */}
      <Animated.View
        style={[
          actionsStyle,
          {
            opacity: fadeAnim,
            transform: [{ translateX: actionTranslateX }],
            gap: 12,
            alignItems: isLeftColumn ? 'flex-start' : 'flex-end',
          },
        ]}
      >
        {/* Playing / Watching button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            isPlaying ? styles.playingBtnActive : styles.btnInactive,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={handlePlayingPress}
        >
          <Ionicons
            name={mediaType === 'games' ? 'game-controller' : 'eye'}
            size={16}
            color={isPlaying ? YELLOW_ACCENT : 'rgba(255,255,255,0.45)'}
          />
          <Text style={[styles.actionLabel, { color: isPlaying ? YELLOW_ACCENT : 'rgba(255,255,255,0.45)' }]}>
            {mediaType === 'games' ? 'Playing' : 'Watching'}
          </Text>
        </Pressable>

        {/* Wishlist button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            isWishlisted ? styles.wishlistBtnActive : styles.btnInactive,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={handleWishlistPress}
        >
          <Ionicons name="bookmark" size={16} color={isWishlisted ? PURPLE_ACCENT : 'rgba(255,255,255,0.45)'} />
          <Text style={[styles.actionLabel, { color: isWishlisted ? PURPLE_ACCENT : 'rgba(255,255,255,0.45)' }]}>Wishlist</Text>
        </Pressable>

        {/* Completed button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            isCompleted ? styles.completedBtnActive : styles.btnInactive,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={handleCompletedPress}
        >
          <Ionicons name="checkmark-circle" size={16} color={isCompleted ? GREEN_ACCENT : 'rgba(255,255,255,0.45)'} />
          <Text style={[styles.actionLabel, { color: isCompleted ? GREEN_ACCENT : 'rgba(255,255,255,0.45)' }]}>Completed</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
});

QuickActionOverlay.displayName = 'QuickActionOverlay';

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
  },

  // Ghost card — mirrors AnimeCardItem structure
  ghostCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: CARD_BG,
    padding: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  ghostCardNoBorder: {
    backgroundColor: 'transparent',
    padding: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostCardInner: {
    flex: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  ghostImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  ghostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  ghostContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 8,
  },
  ghostTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  ghostYear: {
    fontSize: 11,
    fontFamily: 'Agdasima',
    color: TEXT_PRIMARY,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Action buttons
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    minWidth: 110,
  },
  btnInactive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  wishlistBtnActive: {
    backgroundColor: PURPLE_DIM,
    borderColor: PURPLE_BORDER,
  },
  playingBtnActive: {
    backgroundColor: YELLOW_DIM,
    borderColor: YELLOW_BORDER,
  },
  completedBtnActive: {
    backgroundColor: GREEN_DIM,
    borderColor: GREEN_BORDER,
  },
  actionBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    letterSpacing: 0.4,
  },
});

export default QuickActionOverlay;
