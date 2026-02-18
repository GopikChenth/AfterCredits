import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { getSettings } from '../../services/settings';
import { useMediaType } from '../../context/MediaTypeContext';

/**
 * SideBar - Floating pill buttons with full-screen blur background.
 * Owns all media-switching logic — just sets mediaType in context.
 * The Home tab (HomeScreen) automatically renders the correct page.
 */

// Sidebar section ID → context mediaType value
const SECTION_MEDIA_MAP = {
  anime: 'anime',
  game:  'games',
  movie: 'movies',
  comic: 'comics',
  manga: 'manga',
};

// Reverse map: context mediaType → sidebar section ID
const MEDIA_TO_SECTION = {
  anime: 'anime',
  games: 'game',
  movies: 'movie',
  comics: 'comic',
  manga: 'manga',
};

const SideBar = ({
  isVisible = false,
  onClose,
}) => {
  const navigation = useNavigation();
  const { mediaType, setMediaType } = useMediaType();

  // Derive active section from global mediaType (single source of truth)
  const activeSection = MEDIA_TO_SECTION[mediaType] || 'anime';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const [visibleSections, setVisibleSections] = React.useState([]);

  const allSections = [
    { id: 'anime', label: 'Anime', icon: '🎌', settingKey: 'showAnime' },
    { id: 'movie', label: 'Movies', icon: '🎬', settingKey: 'showMovies' },
    { id: 'game', label: 'Games', icon: '🎮', settingKey: 'showGames' },
    { id: 'comic', label: 'Comics', icon: '📚', settingKey: 'showComics' },
    { id: 'manga', label: 'Manga', icon: '📖', settingKey: 'showManga' },
  ];

  // Load settings and filter sections when sidebar becomes visible
  useEffect(() => {
    if (isVisible) loadVisibleSections();
  }, [isVisible]);

  const loadVisibleSections = async () => {
    const settings = await getSettings();
    const filtered = allSections.filter(s => settings[s.settingKey]);
    setVisibleSections(filtered);
  };

  // Fade and slide animation
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible]);

  const handleSectionPress = (sectionId) => {
    if (sectionId === activeSection) {
      onClose?.();
      return;
    }

    const newMediaType = SECTION_MEDIA_MAP[sectionId];
    if (!newMediaType) return;

    // 1. Set global media type — HomeScreen will auto-swap to the right page
    setMediaType(newMediaType);

    // 2. Navigate to Home tab so the user sees the change
    navigation.navigate('MainTabs', { screen: 'Home' });

    // 3. Close sidebar
    setTimeout(() => onClose?.(), 100);
  };



  // Pill blur container
  const PillBlur = ({ children, isActive }) => {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.pillWeb, isActive && styles.pillActiveWeb]}>
          {children}
        </View>
      );
    }
    return (
      <BlurView
        intensity={isActive ? 60 : 80}
        tint="dark"
        style={styles.pillNative}
      >
        {children}
      </BlurView>
    );
  };

  // Background blur overlay (full screen)
  const BackgroundBlur = () => {
    if (Platform.OS === 'web') {
      return <View style={styles.backgroundBlurWeb} />;
    }
    return (
      <BlurView intensity={20} tint="dark" style={styles.backgroundBlurNative} />
    );
  };

  return (
    <>
      {/* Full screen blur background */}
      <Animated.View
        style={[
          styles.backgroundOverlay,
          { opacity: fadeAnim },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <Pressable 
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        >
          <BackgroundBlur />
        </Pressable>
      </Animated.View>

      {/* Floating pills */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        {visibleSections.map((section) => (
          <Animated.View key={section.id} style={styles.pillWrapper}>
            <Pressable
              style={styles.pill}
              onPress={() => handleSectionPress(section.id)}
              android_ripple={null}
              underlayColor="transparent"
              hitSlop={{top: 0, bottom: 0, left: 0, right: 0}}
              pressRetentionOffset={{top: 0, bottom: 0, left: 0, right: 0}}
            >
              <PillBlur isActive={activeSection === section.id}>
                <View
                  style={[
                    styles.pillContent,
                    activeSection === section.id && styles.pillContentActive,
                  ]}
                >
                  <Text style={styles.pillIcon}>{section.icon}</Text>
                  <Text
                    style={[
                      styles.pillLabel,
                      activeSection === section.id && styles.pillLabelActive,
                    ]}
                  >
                    {section.label}
                  </Text>
                </View>
              </PillBlur>
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  backgroundBlurWeb: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  backgroundBlurNative: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    left: 16,
    top: 120, // Avoid status bar (increased from 100)
    zIndex: 999,
  },
  pillWrapper: {
    marginBottom: 12,
    borderWidth: 0, // No borders
  },
  pill: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0, // Remove any borders
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)',
        outline: 'none', // Remove web focus outline
      },
    }),
  },
  pillWeb: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  },
  pillActiveWeb: {
    backgroundColor: 'rgba(175, 82, 222, 0.4)',
  },
  pillNative: {
    overflow: 'hidden',
    borderWidth: 0, // No borders
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // Increased from 10
    paddingHorizontal: 20, // Increased from 16
    paddingLeft: 16, // Increased from 14
    minWidth: 120, // Minimum width for pills
    borderWidth: 0, // No borders
  },
  pillContentActive: {
    backgroundColor: 'rgba(175, 82, 222, 0.25)',
  },
  pillIcon: {
    fontSize: 22, // Increased from 18
    marginRight: 10, // Increased from 8
  },
  pillLabel: {
    fontSize: 15, // Increased from 13
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  pillLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SideBar;