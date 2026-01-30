import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * SideBar - Just floating pill buttons with full-screen blur background
 */
const SideBar = ({
  isVisible = false,
  onClose,
  activeSection = 'anime',
  onSectionChange,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  const sections = [
    { id: 'anime', label: 'Anime', icon: '🎌' },
    { id: 'movie', label: 'Movies', icon: '🎬' },
    { id: 'game', label: 'Games', icon: '🎮' },
    { id: 'comic', label: 'Comics', icon: '📚' },
    { id: 'manga', label: 'Manga', icon: '📖' },
  ];

  // Fade and slide animation
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleSectionPress = (sectionId) => {
    onSectionChange?.(sectionId);
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
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <BackgroundBlur />
        </TouchableOpacity>
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
        {sections.map((section) => (
          <Animated.View key={section.id} style={styles.pillWrapper}>
            <TouchableOpacity
              style={styles.pill}
              onPress={() => handleSectionPress(section.id)}
              activeOpacity={0.7}
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
            </TouchableOpacity>
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
  },
  pill: {
    borderRadius: 20,
    overflow: 'hidden',
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
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // Increased from 10
    paddingHorizontal: 16, // Increased from 14
    paddingLeft: 14, // Increased from 12
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
