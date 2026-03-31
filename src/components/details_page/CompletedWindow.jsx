/**
 * CompletedWindow
 *
 * Centered popup that appears when the user marks a game as Completed.
 * Shows:
 *   1. Platform selector (PC, PS5, PS4, Xbox, Switch, Steam Deck, etc.)
 *   2. Playtime input — how many hours they spent
 *   3. DLC / Expansion checklist fetched from IGDB
 *
 * Saves to AsyncStorage + Supabase:
 *   game_platform_${gameId}  → platform id string
 *   game_playtime_${gameId}  → hours string
 *   game_dlcs_${gameId}      → JSON array of checked DLC ids
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  PanResponder,
  InteractionManager,
  AccessibilityInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { getGameDLCs } from '../../services/api_igdb';
import { saveGameCompletionDetails, saveGameTracking } from '../../services/mediaStatusService';

let HapticsModule = null;
try {
  const mod = require('@mhpdev/react-native-haptics');
  HapticsModule = mod?.default ?? mod;
} catch (_) {
  HapticsModule = null;
}

const ACCENT   = '#0FA3B1';
const BG       = '#131313';
const SURFACE  = '#1C1C1C';
const BORDER   = 'rgba(15,163,177,0.18)';
const TEXT     = '#FFFFFF';
const MUTED    = '#777777';
const COMPLETE = '#22D3EE';
const POPUP_IN_MS = 24;
const POPUP_OUT_MS = 60;
const CONTENT_IN_MS = 140;
const CONTENT_OUT_MS = 80;

// ── Platform definitions ──────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'pc',          label: 'PC',           icon: 'desktop-outline',            iconLib: 'ion' },
  { id: 'ps5',         label: 'PS5',          icon: 'logo-playstation',            iconLib: 'ion' },
  { id: 'ps4',         label: 'PS4',          icon: 'logo-playstation',            iconLib: 'ion' },
  { id: 'xbox_x',      label: 'Xbox X|S',     icon: 'logo-xbox',                   iconLib: 'ion' },
  { id: 'xbox_one',    label: 'Xbox One',     icon: 'logo-xbox',                   iconLib: 'ion' },
  { id: 'switch',      label: 'Switch',       icon: 'game-controller-outline',     iconLib: 'ion' },
  { id: 'steam_deck',  label: 'Steam Deck',   icon: 'steam',                       iconLib: 'mci' },
  { id: 'mobile',      label: 'Mobile',       icon: 'phone-portrait-outline',      iconLib: 'ion' },
  { id: 'gog',         label: 'GOG',          icon: 'storefront-outline',          iconLib: 'ion' },
  { id: 'epic',        label: 'Epic',         icon: 'storefront-outline',          iconLib: 'ion' },
];

const PlatformChip = ({ platform, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.platformChip, selected && styles.platformChipSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {platform.iconLib === 'mci' ? (
      <MaterialCommunityIcons
        name={platform.icon}
        size={13}
        color={selected ? BG : MUTED}
      />
    ) : (
      <Ionicons
        name={platform.icon}
        size={13}
        color={selected ? BG : MUTED}
      />
    )}
    <Text style={[styles.platformLabel, selected && styles.platformLabelSelected]}>
      {platform.label}
    </Text>
  </TouchableOpacity>
);

// ── DLC row ───────────────────────────────────────────────────────────────────
const DlcRow = ({ dlc, checked, onToggle }) => (
  <TouchableOpacity
    style={[styles.dlcRow, checked && styles.dlcRowChecked]}
    onPress={onToggle}
    activeOpacity={0.7}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
  >
    {dlc.coverImage ? (
      <Image
        source={{ uri: dlc.coverImage }}
        style={styles.dlcCover}
        contentFit="cover"
        recyclingKey={`dlc-${dlc.id}`}
      />
    ) : (
      <View style={[styles.dlcCover, styles.dlcCoverPlaceholder]}>
        <Ionicons name="extension-puzzle-outline" size={14} color={ACCENT} />
      </View>
    )}

    <View style={styles.dlcInfo}>
      <Text style={styles.dlcName} numberOfLines={2}>{dlc.name}</Text>
      <View style={styles.dlcMeta}>
        <Text style={styles.dlcTag}>{dlc.category}</Text>
        {dlc.releaseDate && <Text style={styles.dlcYear}> · {dlc.releaseDate}</Text>}
      </View>
    </View>

    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Ionicons name="checkmark" size={12} color="#000" />}
    </View>
  </TouchableOpacity>
);

// ── Draggable haptic slider for Overall Completion ────────────────────────────
const OverallHapticSlider = ({ value, onChange }) => {
  const THUMB = 22;
  const lastPctRef = useRef(-1);
  const trackWRef = useRef(200);
  const startPctRef = useRef(0);

  const triggerHaptic = (pct) => {
    if (pct !== lastPctRef.current) {
      lastPctRef.current = pct;
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
        const x = e.nativeEvent.locationX;
        const pct = clampPct((x / trackWRef.current) * 100);
        startPctRef.current = pct;
        onChange(pct);
        triggerHaptic(pct);
      },
      onPanResponderMove: (_e, gs) => {
        const dxPct = (gs.dx / trackWRef.current) * 100;
        const pct = clampPct(startPctRef.current + dxPct);
        onChange(pct);
        triggerHaptic(pct);
      },
    })
  ).current;

  const thumbLeft = `${value}%`;

  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderMin}>0</Text>
      <View
        style={styles.sliderTrack}
        onLayout={(e) => { trackWRef.current = e.nativeEvent.layout.width; }}
        {...panRef.panHandlers}
      >
        <View style={[styles.sliderFill, { width: `${value}%` }]} />
        <View style={[styles.sliderThumbOuter, { left: thumbLeft, marginLeft: -(THUMB / 2) }]}>
          <View style={styles.sliderThumb} />
        </View>
      </View>
      <Text style={styles.sliderMax}>100</Text>
    </View>
  );
};

// ── Main popup ────────────────────────────────────────────────────────────────
const CompletedWindow = ({ visible, gameId, igdbId, gameName, timeToBeat, onClose }) => {
  const scaleAnim = useSharedValue(0.92);
  const translateYAnim = useSharedValue(8);
  const opacityAnim = useSharedValue(0);
  const backdropAnim = useSharedValue(0);
  const contentOpacityAnim = useSharedValue(0);
  const contentTranslateYAnim = useSharedValue(8);
  const { width: vw } = useWindowDimensions();

  const [selectedPlatform, setSelectedPlatform] = useState('pc');
  const [hours, setHours]                       = useState('');
  const [overallPct, setOverallPct]             = useState(33);
  const [dlcs, setDlcs]                         = useState([]);
  const [checkedDlcs, setCheckedDlcs]           = useState({});
  const [isLoadingDlcs, setIsLoadingDlcs]       = useState(false);
  const [isSaving, setIsSaving]                 = useState(false);
  const [isStory, setIsStory]                   = useState(true);
  const [isMultiplayer, setIsMultiplayer]       = useState(false);
  const dlcCacheRef = useRef({ igdbId: null, data: [] });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => { if (mounted) setReduceMotion(!!enabled); })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      setReduceMotion(!!enabled);
    });

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropAnim.value,
  }));

  const popupStyle = useAnimatedStyle(() => ({
    opacity: opacityAnim.value,
    transform: [{ translateY: translateYAnim.value }, { scale: scaleAnim.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacityAnim.value,
    transform: [{ translateY: contentTranslateYAnim.value }],
  }));

  // ── Animate in + load data ────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const popupIn = { duration: reduceMotion ? 1 : POPUP_IN_MS, easing: Easing.out(Easing.quad) };
    const contentIn = { duration: reduceMotion ? 1 : CONTENT_IN_MS, easing: Easing.out(Easing.exp) };

    // Fire animation immediately — no blocking
    scaleAnim.value = 0.92;
    translateYAnim.value = reduceMotion ? 0 : 8;
    opacityAnim.value = 0;
    backdropAnim.value = 0;
    contentOpacityAnim.value = 0;
    contentTranslateYAnim.value = reduceMotion ? 0 : 8;

    scaleAnim.value = withTiming(1, popupIn);
    translateYAnim.value = withTiming(0, popupIn);
    opacityAnim.value = withTiming(1, popupIn);
    backdropAnim.value = withTiming(1, popupIn);
    contentOpacityAnim.value = withDelay(reduceMotion ? 0 : 12, withTiming(1, contentIn));
    contentTranslateYAnim.value = withDelay(reduceMotion ? 0 : 12, withTiming(0, contentIn));

    // Restore saved values (fast local read, deferred to not block animation)
    InteractionManager.runAfterInteractions(() => {
      AsyncStorage.multiGet([
        `game_platform_${gameId}`,
        `game_playtime_${gameId}`,
        `game_dlcs_${gameId}`,
        `game_overall_progress_${gameId}`,
        `game_multiplayer_${gameId}`,
        `game_story_${gameId}`,
      ]).then(pairs => {
        setSelectedPlatform(pairs[0][1] || 'pc');
        setHours(pairs[1][1] || '');
        try {
          const arr = pairs[2][1] ? JSON.parse(pairs[2][1]) : [];
          const map = {};
          arr.forEach(id => { map[id] = true; });
          setCheckedDlcs(map);
        } catch (_) {}
        const saved = Number(pairs[3][1]);
        setOverallPct(Number.isFinite(saved) ? saved : 33);
        setIsMultiplayer(pairs[4][1] === 'true');
        setIsStory(pairs[5][1] !== 'false');
      });

      // Fetch DLCs only if not already cached for this game
      if (dlcCacheRef.current.igdbId === igdbId) {
        setDlcs(dlcCacheRef.current.data);
      } else {
        setIsLoadingDlcs(true);
        getGameDLCs(igdbId).then(results => {
          const data = results || [];
          dlcCacheRef.current = { igdbId, data };
          setDlcs(data);
          setIsLoadingDlcs(false);
        }).catch(() => {
          dlcCacheRef.current = { igdbId, data: [] };
          setDlcs([]);
          setIsLoadingDlcs(false);
        });
      }
    });
  }, [visible, gameId, igdbId, scaleAnim, translateYAnim, opacityAnim, backdropAnim, contentOpacityAnim, contentTranslateYAnim, reduceMotion]);

  // ── Close animation ────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    const popupOut = { duration: reduceMotion ? 1 : POPUP_OUT_MS, easing: Easing.in(Easing.quad) };
    const contentOut = { duration: reduceMotion ? 1 : CONTENT_OUT_MS, easing: Easing.in(Easing.quad) };

    contentOpacityAnim.value = withTiming(0, contentOut);
    contentTranslateYAnim.value = withTiming(reduceMotion ? 0 : 6, contentOut);
    backdropAnim.value = withTiming(0, popupOut);
    opacityAnim.value = withTiming(0, popupOut);
    translateYAnim.value = withTiming(reduceMotion ? 0 : 8, popupOut);
    scaleAnim.value = withTiming(0.92, popupOut, (finished) => {
      if (finished && onClose) runOnJS(onClose)();
    });
  }, [scaleAnim, translateYAnim, opacityAnim, backdropAnim, contentOpacityAnim, contentTranslateYAnim, onClose, reduceMotion]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const selectedDlcIds = Object.keys(checkedDlcs).filter(k => checkedDlcs[k]);
      const parsedHours = Number.parseFloat(hours.trim());
      const playtimeHours = Number.isFinite(parsedHours) ? parsedHours : null;

      await Promise.all([
        selectedPlatform
          ? AsyncStorage.setItem(`game_platform_${gameId}`, selectedPlatform)
          : AsyncStorage.removeItem(`game_platform_${gameId}`),
        hours.trim()
          ? AsyncStorage.setItem(`game_playtime_${gameId}`, hours.trim())
          : AsyncStorage.removeItem(`game_playtime_${gameId}`),
        AsyncStorage.setItem(
          `game_dlcs_${gameId}`,
          JSON.stringify(selectedDlcIds)
        ),
        AsyncStorage.multiSet([
          [`game_story_progress_${gameId}`, '100'],
          [`game_overall_progress_${gameId}`, String(overallPct)],
          [`game_multiplayer_${gameId}`, String(isMultiplayer)],
          [`game_story_${gameId}`, String(isStory)],
        ]),
      ]);

      // Sync multiplayer flag to DB
      saveGameTracking(String(gameId), { isMultiplayer, isStory });

      const dbResult = await saveGameCompletionDetails(String(gameId), {
        platform: selectedPlatform,
        playtimeHours,
        completedDlcs: selectedDlcIds,
        overallProgress: overallPct,
        mainStoryHours: timeToBeat?.mainStory ?? null,
        completionistHours: timeToBeat?.completionist ?? null,
      });

      if (!dbResult?.success) {
        console.warn('CompletedWindow DB save failed:', dbResult?.error || 'Unknown error');
      }
    } finally {
      setIsSaving(false);
      handleClose();
    }
  }, [selectedPlatform, hours, checkedDlcs, overallPct, isMultiplayer, isStory, gameId, handleClose, timeToBeat]);

  const toggleDlc = useCallback((id) => {
    setCheckedDlcs(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const checkedCount = Object.keys(checkedDlcs).filter(k => checkedDlcs[k]).length;
  const popupWidth = Math.min(vw * 0.9, 420);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Popup card */}
        <Animated.View
          style={[
            styles.popup,
            { width: popupWidth },
            popupStyle,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.completeIcon}>
                <Ionicons name="checkmark-circle" size={20} color={COMPLETE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Game Completed!</Text>
                <Text style={styles.headerSub} numberOfLines={1}>{gameName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={16} color={MUTED} />
            </TouchableOpacity>
          </View>

          <Animated.View style={contentStyle}>
            {/* Game Type Chips - always visible */}
            <View style={styles.gameTypeStrip}>
              <TouchableOpacity
                style={[styles.gameTypeChip, isStory && styles.gameTypeChipStory]}
                onPress={() => setIsStory(prev => !prev)}
                activeOpacity={0.7}
              >
                <Ionicons name={isStory ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={isStory ? ACCENT : MUTED} />
                <Text style={[styles.gameTypeChipText, isStory && { color: ACCENT }]}>Story</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gameTypeChip, isMultiplayer && styles.gameTypeChipMP]}
                onPress={() => setIsMultiplayer(prev => !prev)}
                activeOpacity={0.7}
              >
                <Ionicons name={isMultiplayer ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={isMultiplayer ? '#A78BFA' : MUTED} />
                <Text style={[styles.gameTypeChipText, isMultiplayer && { color: '#A78BFA' }]}>Multiplayer</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable body */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

            {/* ── Platform ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="desktop-outline" size={15} color={ACCENT} />
                <Text style={styles.sectionTitle}>Played On</Text>
                {selectedPlatform && (
                  <Text style={styles.selectedPlatformBadge}>
                    {PLATFORMS.find(p => p.id === selectedPlatform)?.label}
                  </Text>
                )}
              </View>
              <View style={styles.platformGrid}>
                {PLATFORMS.map(p => (
                  <PlatformChip
                    key={p.id}
                    platform={p}
                    selected={selectedPlatform === p.id}
                    onPress={() => setSelectedPlatform(prev => prev === p.id ? null : p.id)}
                  />
                ))}
              </View>
            </View>

            {/* ── Time Spent ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={15} color={ACCENT} />
                <Text style={styles.sectionTitle}>Time Spent</Text>
              </View>
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  value={hours}
                  onChangeText={setHours}
                  placeholder="0"
                  placeholderTextColor="#333"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  maxLength={6}
                  accessibilityLabel="Hours played"
                />
                <Text style={styles.timeUnit}>hours played</Text>
              </View>
            </View>

            {/* ── Overall Completion ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart-outline" size={15} color="#60A5FA" />
                <Text style={[styles.sectionTitle, { color: '#60A5FA' }]}>Overall Completion</Text>
                <Text style={styles.overallPctBadge}>{overallPct}%</Text>
              </View>
              <OverallHapticSlider value={overallPct} onChange={setOverallPct} />
            </View>

            {/* ── DLC / Expansions ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="extension-puzzle-outline" size={15} color={ACCENT} />
                <Text style={styles.sectionTitle}>DLC &amp; Expansions</Text>
                {dlcs.length > 0 && (
                  <Text style={styles.dlcBadge}>{checkedCount}/{dlcs.length}</Text>
                )}
              </View>

              {isLoadingDlcs && (
                <View style={styles.stateRow}>
                  <ActivityIndicator size="small" color={ACCENT} />
                  <Text style={styles.stateText}>Searching IGDB…</Text>
                </View>
              )}

              {!isLoadingDlcs && dlcs.length === 0 && (
                <View style={styles.stateRow}>
                  <Ionicons name="checkmark-done-outline" size={14} color={MUTED} />
                  <Text style={styles.stateText}>No DLC found</Text>
                </View>
              )}

              {!isLoadingDlcs && dlcs.length > 0 && (
                <>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.round((checkedCount / dlcs.length) * 100)}%` },
                      ]}
                    />
                  </View>
                  {dlcs.map(dlc => (
                    <DlcRow
                      key={dlc.id}
                      dlc={dlc}
                      checked={!!checkedDlcs[dlc.id]}
                      onToggle={() => toggleDlc(dlc.id)}
                    />
                  ))}
                </>
              )}
            </View>
            </ScrollView>

            {/* Save button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Text style={styles.saveBtnText}>Save &amp; Close</Text>
                }
              </TouchableOpacity>
            </View>
          </Animated.View>
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
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  completeIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  headerSub:   { fontSize: 11, color: MUTED, marginTop: 1 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Scroll ──
  scroll: { flexShrink: 1 },
  scrollContent: { padding: 14 },

  // ── Section card ──
  section: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12,
  },
  sectionTitle: {
    flex: 1, fontSize: 10, fontWeight: '800', color: ACCENT,
    letterSpacing: 1.6, textTransform: 'uppercase',
  },
  selectedPlatformBadge: {
    fontSize: 9, fontWeight: '700', color: COMPLETE,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // ── Platform grid ──
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  platformChipSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  platformLabel: {
    fontSize: 11, fontWeight: '600', color: MUTED,
  },
  platformLabelSelected: {
    color: BG,
  },

  // ── Time input ──
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeInput: {
    width: 100,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: '#0D0D0D',
    fontSize: 28,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  timeUnit: { fontSize: 14, color: MUTED, fontWeight: '500' },

  // ── States ──
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  stateText: { fontSize: 12, color: MUTED, fontStyle: 'italic' },

  // ── DLC progress ──
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COMPLETE,
    borderRadius: 2,
  },

  // ── DLC rows ──
  dlcBadge: { fontSize: 10, color: COMPLETE, fontWeight: '700' },
  dlcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dlcRowChecked: { opacity: 0.5 },
  dlcCover: { width: 30, height: 40, borderRadius: 4, backgroundColor: '#222' },
  dlcCoverPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  dlcInfo: { flex: 1 },
  dlcName: { fontSize: 12, color: TEXT, fontWeight: '600', lineHeight: 16 },
  dlcMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dlcTag: { fontSize: 8, fontWeight: '800', color: ACCENT, letterSpacing: 1, textTransform: 'uppercase' },
  dlcYear: { fontSize: 9, color: MUTED },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COMPLETE, borderColor: COMPLETE },

  // ── Footer ──
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  saveBtn: {
    backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#000', letterSpacing: 0.4 },

  // ── Overall slider ──
  overallPctBadge: { fontSize: 14, fontWeight: '900', color: '#60A5FA' },
  sliderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
    paddingVertical: 10,
  },
  sliderMin: { fontSize: 9, color: MUTED, fontWeight: '700', width: 20, textAlign: 'center' },
  sliderMax: { fontSize: 9, color: MUTED, fontWeight: '700', width: 24, textAlign: 'center' },
  sliderTrack: {
    flex: 1, height: 6, backgroundColor: '#1A1A1A',
    borderRadius: 3, position: 'relative', justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute', left: 0, height: '100%',
    borderRadius: 3, backgroundColor: '#60A5FA',
  },
  sliderThumbOuter: {
    position: 'absolute', top: -8,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  sliderThumb: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#0D0D0D', borderWidth: 2.5, borderColor: '#60A5FA',
    shadowColor: '#60A5FA', shadowOpacity: 0.5, shadowRadius: 6, elevation: 6,
  },
  sliderBtnRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 6,
  },
  sliderPreset: {
    flex: 1, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  sliderPresetActive: {
    backgroundColor: 'rgba(96,165,250,0.15)', borderColor: 'rgba(96,165,250,0.4)',
  },
  sliderPresetText: { fontSize: 10, fontWeight: '700', color: MUTED },
  sliderPresetTextActive: { color: '#60A5FA' },

  // Game Type Chips
  gameTypeStrip: {
    flexDirection: 'row', gap: 6, marginBottom: 6, paddingHorizontal: 2,
  },
  gameTypeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gameTypeChipStory: {
    borderColor: 'rgba(15,163,177,0.3)', backgroundColor: 'rgba(15,163,177,0.08)',
  },
  gameTypeChipMP: {
    borderColor: 'rgba(167,139,250,0.3)', backgroundColor: 'rgba(167,139,250,0.08)',
  },
  gameTypeChipText: { fontSize: 11, fontWeight: '600', color: MUTED },
});

export default CompletedWindow;
