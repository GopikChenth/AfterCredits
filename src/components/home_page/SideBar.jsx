import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { getSettings } from '../../services/settings';
import { useMediaType } from '../../context/MediaTypeContext';

let HapticsModule = null;
try {
  const mod = require('@mhpdev/react-native-haptics');
  HapticsModule = mod?.default ?? mod;
} catch {
  HapticsModule = null;
}

/**
 * SideBar - Floating pill buttons with full-screen blur background.
 * Owns all media-switching logic — just sets mediaType in context.
 * The Home tab (HomeScreen) automatically renders the correct page.
 */

// Sidebar section ID → context mediaType value
const SECTION_MEDIA_MAP = {
  anime: 'anime',
  games: 'games',
  movies: 'movies',
  comics: 'comics',
  manga: 'manga',
};

// Reverse map: context mediaType → sidebar section ID
const MEDIA_TO_SECTION = {
  anime: 'anime',
  games: 'games',
  movies: 'movies',
  comics: 'comics',
  manga: 'manga',
};

// Defined at module level — recreating this array on every render is wasteful.
const ALL_SECTIONS = [
  { id: 'anime',  label: 'Anime',  icon: '🎌', settingKey: 'showAnime' },
  { id: 'movies', label: 'Movies', icon: '🎬', settingKey: 'showMovies' },
  { id: 'games',  label: 'Games',  icon: '🎮', settingKey: 'showGames' },
  { id: 'comics', label: 'Comics', icon: '📚', settingKey: 'showComics' },
  { id: 'manga',  label: 'Manga',  icon: '📖', settingKey: 'showManga' },
];

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

  // allSections is defined at module level to avoid recreation on every render

  // Load settings and filter sections when sidebar becomes visible
  useEffect(() => {
    if (isVisible) loadVisibleSections();
  }, [isVisible]);

  const loadVisibleSections = async () => {
    const settings = await getSettings();
    const order = Array.isArray(settings.sidebarOrder) ? settings.sidebarOrder : [];
    const rankMap = new Map(order.map((id, index) => [id, index]));
    const filtered = ALL_SECTIONS
      .filter(s => settings[s.settingKey])
      .sort((a, b) => {
        const aRank = rankMap.has(a.id) ? rankMap.get(a.id) : Number.MAX_SAFE_INTEGER;
        const bRank = rankMap.has(b.id) ? rankMap.get(b.id) : Number.MAX_SAFE_INTEGER;
        return aRank - bRank;
      });
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

  const triggerImpact = (style) => {
    if (Platform.OS === 'web') return;
    if (!HapticsModule?.impact) return;
    try {
      const maybePromise = HapticsModule.impact(style);
      if (maybePromise?.catch) maybePromise.catch(() => {});
    } catch {
      // No-op if native module isn't available (e.g. Expo Go).
    }
  };

  const handleSectionPress = (sectionId) => {
    if (sectionId === activeSection) {
      triggerImpact('light');
      onClose?.();
      return;
    }

    const newMediaType = SECTION_MEDIA_MAP[sectionId];
    if (!newMediaType) return;

    triggerImpact('medium');
    // Close first so the exit animation plays fully (150ms),
    // then switch media type and navigate after it completes.
    onClose?.();
    setTimeout(() => {
      setMediaType(newMediaType);
      navigation.navigate('MainTabs', { screen: 'Home' });
    }, 200);
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
      <View style={styles.pillNative}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={isActive ? 15 : 20}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.8)"
        />
        {children}
      </View>
    );
  };

  // Background blur overlay (full screen)
  const BackgroundBlur = () => {
    if (Platform.OS === 'web') {
      return <View style={styles.backgroundBlurWeb} />;
    }
    return (
      <View style={styles.backgroundBlurNative}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={5}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.5)"
        />
      </View>
    );
  };

  return (
    <>
      {/* Full screen blur background */}
      <Animated.View
        style={[styles.backgroundOverlay, { opacity: fadeAnim }]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BackgroundBlur />
        </Pressable>
      </Animated.View>

      {/* Floating pills */}
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
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
    top: 120,
    zIndex: 999,
  },
  pillWrapper: {
    marginBottom: 12,
    borderWidth: 0,
  },
  pill: {
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 0,
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
        outline: 'none',
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
    borderWidth: 0,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingLeft: 16,
    minWidth: 120,
    borderWidth: 0,
  },
  pillContentActive: {
    backgroundColor: 'rgba(175, 82, 222, 0.25)',
  },
  pillIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  pillLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  pillLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SideBar;
