/**
 * PlayingWindow
 *
 * Centered popup that appears when the user marks a game as Playing.
 * Shows:
 *   1. Story Progression slider (0–100%) with haptic feedback
 *   2. Overall Progression slider (0–100%) with haptic feedback
 *
 * Saves to AsyncStorage + Supabase:
 *   game_story_progress_${gameId}   → number (0–100)
 *   game_overall_progress_${gameId} → number (0–100)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  PanResponder,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
let HapticsModule = null;
try {
  const mod = require('@mhpdev/react-native-haptics');
  HapticsModule = mod?.default ?? mod;
} catch (_) {
  HapticsModule = null;
}
import { saveGamePlayingProgress } from '../../services/mediaStatusService';

const ACCENT   = '#FBBF24';  // yellow — matches "Playing" status colour
const BG       = '#131313';
const SURFACE  = '#1C1C1C';
const BORDER   = 'rgba(251,191,36,0.18)';
const TEXT     = '#FFFFFF';
const MUTED    = '#777777';
const TRACK_BG = '#222222';
const FAST_IN  = { duration: 80, easing: Easing.out(Easing.cubic) };
const FAST_OUT = { duration: 60, easing: Easing.in(Easing.quad) };

const PLATFORMS = [
  { id: 'pc', label: 'PC', icon: 'desktop-outline' },
  { id: 'ps5', label: 'PS5', icon: 'logo-playstation' },
  { id: 'xbox_x', label: 'Xbox X|S', icon: 'logo-xbox' },
  { id: 'switch', label: 'Switch', icon: 'game-controller-outline' },
  { id: 'steam_deck', label: 'Steam Deck', icon: 'desktop-outline' },
  { id: 'mobile', label: 'Mobile', icon: 'phone-portrait-outline' },
];

// ── Haptic slider ─────────────────────────────────────────────────────────────
const HapticSlider = ({ value, onChange, color = ACCENT, label }) => {
  const THUMB = 26;
  const lastHapticRef = useRef(-1);
  const trackWRef = useRef(200);
  const startPctRef = useRef(0);

  const triggerHaptic = (pct) => {
    const bucket = Math.floor(pct / 10);
    if (bucket !== lastHapticRef.current) {
      lastHapticRef.current = bucket;
      try {
        if (HapticsModule?.impact) {
          HapticsModule.impact(pct === 0 || pct === 100 ? 'heavy' : 'light');
        }
      } catch (_) {}
    }
  };

  const clampPct = (v) => Math.round(Math.max(0, Math.min(100, v)));

  const panRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        // Capture starting % from the initial tap position within the track
        const x = e.nativeEvent.locationX;
        const pct = clampPct((x / trackWRef.current) * 100);
        startPctRef.current = pct;
        onChange(pct);
        triggerHaptic(pct);
      },
      onPanResponderMove: (_e, gs) => {
        // Use dx (accumulated drag distance) for stable movement
        const dxPct = (gs.dx / trackWRef.current) * 100;
        const pct = clampPct(startPctRef.current + dxPct);
        onChange(pct);
        triggerHaptic(pct);
      },
    })
  ).current;

  const thumbLeft = `${value}%`;

  return (
    <View style={hStyles.wrapper}>
      <View style={hStyles.labelRow}>
        <Text style={hStyles.label}>{label}</Text>
        <Text style={[hStyles.pct, { color }]}>{value}%</Text>
      </View>
      <View
        style={hStyles.track}
        onLayout={e => { trackWRef.current = e.nativeEvent.layout.width; }}
        {...panRef.panHandlers}
      >
        {/* Filled portion */}
        <View style={[hStyles.fill, { width: `${value}%`, backgroundColor: color }]} />
        {/* Thumb */}
        <View
          style={[
            hStyles.thumb,
            { left: thumbLeft, marginLeft: -(THUMB / 2), borderColor: color, shadowColor: color },
          ]}
        />
      </View>
      {/* Tick marks at 0, 25, 50, 75, 100 */}
      <View style={hStyles.ticks}>
        {[0, 25, 50, 75, 100].map(t => (
          <Text key={t} style={hStyles.tick}>{t}</Text>
        ))}
      </View>
    </View>
  );
};

const hStyles = StyleSheet.create({
  wrapper:   { marginBottom: 20 },
  labelRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label:     { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1, textTransform: 'uppercase' },
  pct:       { fontSize: 18, fontWeight: '900' },
  track: {
    height: 8,
    backgroundColor: TRACK_BG,
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    height: '100%',
    left: 0,
    borderRadius: 4,
    opacity: 0.85,
  },
  thumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    top: -9,
    borderRadius: 13,
    backgroundColor: '#1A1A1A',
    borderWidth: 2.5,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  tick: { fontSize: 9, color: '#444' },
});

// ── Main popup ────────────────────────────────────────────────────────────────
const PlayingWindow = ({ visible, gameId, gameName, onClose }) => {
  const scaleAnim = useSharedValue(0.92);
  const opacityAnim = useSharedValue(0);
  const backdropAnim = useSharedValue(0);
  const { width: vw } = useWindowDimensions();

  const [storyPct, setStoryPct] = useState(0);
  const [overallPct, setOverallPct] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropAnim.value,
  }));

  const popupStyle = useAnimatedStyle(() => ({
    opacity: opacityAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  useEffect(() => {
    if (!visible) return;

    // Fire animation immediately
    scaleAnim.value = 0.92;
    opacityAnim.value = 0;
    backdropAnim.value = 0;

    scaleAnim.value = withTiming(1, FAST_IN);
    opacityAnim.value = withTiming(1, FAST_IN);
    backdropAnim.value = withTiming(1, FAST_IN);

    // Defer data loading so animation is never blocked
    InteractionManager.runAfterInteractions(() => {
      AsyncStorage.multiGet([
        `game_story_progress_${gameId}`,
        `game_overall_progress_${gameId}`,
        `game_platform_${gameId}`,
      ]).then((pairs) => {
        setStoryPct(pairs[0][1] != null ? Number(pairs[0][1]) : 0);
        setOverallPct(pairs[1][1] != null ? Number(pairs[1][1]) : 0);
        setSelectedPlatform(pairs[2][1] || null);
      });
    });
  }, [visible, gameId, scaleAnim, opacityAnim, backdropAnim]);

  const handleClose = useCallback(() => {
    backdropAnim.value = withTiming(0, FAST_OUT);
    opacityAnim.value = withTiming(0, FAST_OUT);
    scaleAnim.value = withTiming(0.92, FAST_OUT, (finished) => {
      if (finished && onClose) runOnJS(onClose)();
    });
  }, [scaleAnim, opacityAnim, backdropAnim, onClose]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        AsyncStorage.multiSet([
          [`game_story_progress_${gameId}`, String(storyPct)],
          [`game_overall_progress_${gameId}`, String(overallPct)],
        ]),
        selectedPlatform
          ? AsyncStorage.setItem(`game_platform_${gameId}`, selectedPlatform)
          : AsyncStorage.removeItem(`game_platform_${gameId}`),
      ]);

      const dbResult = await saveGamePlayingProgress(
        String(gameId),
        storyPct,
        overallPct,
        selectedPlatform
      );
      if (!dbResult?.success) {
        console.warn('PlayingWindow DB save failed:', dbResult?.error || 'Unknown error');
      }
      try { HapticsModule?.impact?.('medium'); } catch (_) {}
    } finally {
      setIsSaving(false);
      handleClose();
    }
  }, [storyPct, overallPct, selectedPlatform, gameId, handleClose]);

  const popupWidth = Math.min(vw * 0.9, 420);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.popup,
            { width: popupWidth },
            popupStyle,
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name="game-controller" size={18} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Now Playing</Text>
                <Text style={styles.headerSub} numberOfLines={1}>{gameName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={16} color={MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled
          >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="desktop-outline" size={14} color={ACCENT} />
                <Text style={styles.sectionTitle}>Platform</Text>
                {selectedPlatform && (
                  <Text style={styles.selectedPlatformBadge}>
                    {PLATFORMS.find((p) => p.id === selectedPlatform)?.label}
                  </Text>
                )}
              </View>
              <View style={styles.platformGrid}>
                {PLATFORMS.map((platform) => {
                  const selected = selectedPlatform === platform.id;
                  return (
                    <TouchableOpacity
                      key={platform.id}
                      style={[styles.platformChip, selected && styles.platformChipSelected]}
                      onPress={() => setSelectedPlatform((prev) => prev === platform.id ? null : platform.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={platform.icon} size={13} color={selected ? BG : MUTED} />
                      <Text style={[styles.platformLabel, selected && styles.platformLabelSelected]}>
                        {platform.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                <Ionicons name="book-outline" size={14} color={ACCENT} />
                <Text style={styles.sectionTitle}>Story Progression</Text>
              </View>
              <HapticSlider value={storyPct} onChange={setStoryPct} color={ACCENT} label="Story" />

              <View style={[styles.sectionHeader, { marginTop: 4 }]}>
                <Ionicons name="stats-chart-outline" size={14} color="#60A5FA" />
                <Text style={[styles.sectionTitle, { color: '#60A5FA' }]}>Overall Completion</Text>
              </View>
              <HapticSlider value={overallPct} onChange={setOverallPct} color="#60A5FA" label="Overall" />
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNum, { color: ACCENT }]}>{storyPct}%</Text>
                <Text style={styles.summaryLabel}>Story</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNum, { color: '#60A5FA' }]}>{overallPct}%</Text>
                <Text style={styles.summaryLabel}>Overall</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save Progress</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 999, elevation: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  popup: {
    backgroundColor: BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  headerSub:   { fontSize: 11, color: MUTED, marginTop: 1 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flexShrink: 1 },
  scrollContent: { padding: 16 },
  section: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: ACCENT,
    letterSpacing: 1.6, textTransform: 'uppercase',
  },
  selectedPlatformBadge: {
    fontSize: 9, fontWeight: '700', color: ACCENT,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 4,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  platformChipSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  platformLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
  },
  platformLabelSelected: {
    color: BG,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  summaryCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  summaryNum:  { fontSize: 28, fontWeight: '900' },
  summaryLabel: { fontSize: 10, color: MUTED, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: {
    fontSize: 14, fontWeight: '800', color: '#000', letterSpacing: 0.4,
  },
});

export default PlayingWindow;
