/**
 * CompletedGameSheet
 *
 * Bottom sheet that slides up when the user marks a game as Completed.
 * Shows:
 *   1. Playtime input — how many hours they spent
 *   2. DLC / Expansion checklist fetched from IGDB
 *
 * Saves to AsyncStorage:
 *   game_playtime_${gameId}  → hours string
 *   game_dlcs_${gameId}      → JSON array of checked DLC ids
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGameDLCs } from '../../services/api_igdb';

const ACCENT   = '#0FA3B1';
const BG       = '#111111';
const SURFACE  = '#1A1A1A';
const BORDER   = 'rgba(15,163,177,0.22)';
const TEXT     = '#FFFFFF';
const MUTED    = '#888888';
const COMPLETE = '#4ADE80';

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
        <Ionicons name="extension-puzzle-outline" size={16} color={ACCENT} />
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
      {checked && <Ionicons name="checkmark" size={13} color="#000" />}
    </View>
  </TouchableOpacity>
);

// ── Main sheet ────────────────────────────────────────────────────────────────
const CompletedGameSheet = ({ visible, gameId, igdbId, gameName, onClose }) => {
  const slideAnim   = useRef(new Animated.Value(700)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [hours, setHours]           = useState('');
  const [dlcs, setDlcs]             = useState([]);
  const [checkedDlcs, setCheckedDlcs] = useState({});
  const [isLoadingDlcs, setIsLoadingDlcs] = useState(false);
  const [isSaving, setIsSaving]     = useState(false);

  // ── Animate in + load data when opened ────────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    // Reset animation values then animate in
    slideAnim.setValue(700);
    backdropAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0, tension: 60, friction: 12, useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1, duration: 250, useNativeDriver: true,
      }),
    ]).start();

    // Restore saved playtime
    AsyncStorage.getItem(`game_playtime_${gameId}`).then(val => {
      setHours(val || '');
    });

    // Restore saved DLC checks
    AsyncStorage.getItem(`game_dlcs_${gameId}`).then(val => {
      if (!val) return;
      try {
        const arr = JSON.parse(val);
        const map = {};
        arr.forEach(id => { map[id] = true; });
        setCheckedDlcs(map);
      } catch (_) {}
    });

    // Fetch DLCs
    setDlcs([]);
    setIsLoadingDlcs(true);
    getGameDLCs(igdbId).then(results => {
      setDlcs(results || []);
      setIsLoadingDlcs(false);
    }).catch(() => {
      setDlcs([]);
      setIsLoadingDlcs(false);
    });
  }, [visible, gameId, igdbId]);

  // ── Close animation ────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 700, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose?.());
  }, [slideAnim, backdropAnim, onClose]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        hours.trim()
          ? AsyncStorage.setItem(`game_playtime_${gameId}`, hours.trim())
          : AsyncStorage.removeItem(`game_playtime_${gameId}`),
        AsyncStorage.setItem(
          `game_dlcs_${gameId}`,
          JSON.stringify(Object.keys(checkedDlcs).filter(k => checkedDlcs[k]))
        ),
      ]);
    } finally {
      setIsSaving(false);
      handleClose();
    }
  }, [hours, checkedDlcs, gameId, handleClose]);

  const toggleDlc = useCallback((id) => {
    setCheckedDlcs(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const checkedCount = Object.keys(checkedDlcs).filter(k => checkedDlcs[k]).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Dimmed backdrop — tap to close */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Sheet card */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.completeIcon}>
                <Ionicons name="checkmark-circle" size={22} color={COMPLETE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Game Completed!</Text>
                <Text style={styles.headerSub} numberOfLines={1}>{gameName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Scrollable body */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Time Spent ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={16} color={ACCENT} />
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

            {/* ── DLC / Expansions ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="extension-puzzle-outline" size={16} color={ACCENT} />
                <Text style={styles.sectionTitle}>DLC &amp; Expansions</Text>
                {dlcs.length > 0 && (
                  <Text style={styles.dlcBadge}>{checkedCount}/{dlcs.length}</Text>
                )}
              </View>

              {/* Loading */}
              {isLoadingDlcs && (
                <View style={styles.stateRow}>
                  <ActivityIndicator size="small" color={ACCENT} />
                  <Text style={styles.stateText}>Searching IGDB for DLC…</Text>
                </View>
              )}

              {/* No DLC found */}
              {!isLoadingDlcs && dlcs.length === 0 && (
                <View style={styles.stateRow}>
                  <Ionicons name="checkmark-done-outline" size={16} color={MUTED} />
                  <Text style={styles.stateText}>No DLC found for this game</Text>
                </View>
              )}

              {/* DLC list */}
              {!isLoadingDlcs && dlcs.length > 0 && (
                <>
                  {/* Progress bar */}
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },

  // ── Sheet ──
  sheet: {
    flex: 1,
    backgroundColor: BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    maxHeight: '88%',
  },

  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A2A2A',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  completeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  headerSub:   { fontSize: 12, color: MUTED, marginTop: 1 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll ──
  scroll: { flex: 1, flexShrink: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },

  // ── Section card ──
  section: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  dlcBadge: {
    fontSize: 11,
    color: COMPLETE,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Time input ──
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timeInput: {
    width: 110,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#0D0D0D',
    fontSize: 32,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  timeUnit: {
    fontSize: 16,
    color: MUTED,
    fontWeight: '500',
  },

  // ── States (loading / empty) ──
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  stateText: {
    fontSize: 13,
    color: MUTED,
    fontStyle: 'italic',
  },

  // ── DLC progress bar ──
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COMPLETE,
    borderRadius: 2,
  },

  // ── DLC row ──
  dlcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dlcRowChecked: { opacity: 0.55 },
  dlcCover: {
    width: 34,
    height: 46,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  dlcCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  dlcInfo: { flex: 1 },
  dlcName: { fontSize: 13, color: TEXT, fontWeight: '600', lineHeight: 18 },
  dlcMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dlcTag: {
    fontSize: 9, fontWeight: '800', color: ACCENT,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  dlcYear: { fontSize: 10, color: MUTED },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COMPLETE,
    borderColor: COMPLETE,
  },

  // ── Footer ──
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
});

export default CompletedGameSheet;
