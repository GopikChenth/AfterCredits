/**
 * CompletedGameSheet
 *
 * Bottom sheet that slides up when the user marks a game as Completed.
 * Lets them:
 *   1. Log how many hours they spent
 *   2. See & check off DLCs / Expansions for this game
 *
 * Storage: AsyncStorage (no schema changes needed)
 *   - `game_playtime_${gameId}`  → string hours
 *   - `game_dlcs_${gameId}`      → JSON array of completed DLC ids
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
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGameDLCs } from '../../services/api_igdb';

const ACCENT   = '#0FA3B1';
const BG       = '#0F0F0F';
const SURFACE  = '#181818';
const BORDER   = 'rgba(15,163,177,0.2)';
const TEXT     = '#FFFFFF';
const MUTED    = '#888';
const COMPLETE = '#4ADE80';

// ── DLC row ───────────────────────────────────────────────────────────────────
const DlcRow = ({ dlc, checked, onToggle }) => (
  <Pressable
    style={[styles.dlcRow, checked && styles.dlcRowChecked]}
    onPress={onToggle}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={dlc.name}
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
        {dlc.releaseDate && <Text style={styles.dlcYear}>{dlc.releaseDate}</Text>}
      </View>
    </View>

    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Ionicons name="checkmark" size={14} color="#000" />}
    </View>
  </Pressable>
);

// ── Main sheet ────────────────────────────────────────────────────────────────
const CompletedGameSheet = ({ visible, gameId, igdbId, gameName, onClose }) => {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [hours, setHours] = useState('');
  const [dlcs, setDlcs] = useState([]);
  const [checkedDlcs, setCheckedDlcs] = useState({});
  const [isLoadingDlcs, setIsLoadingDlcs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load saved state + fetch DLCs when opened ──
  useEffect(() => {
    if (!visible || !gameId) return;

    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Load saved playtime
    AsyncStorage.getItem(`game_playtime_${gameId}`).then(val => {
      if (val) setHours(val);
    });

    // Load saved DLC checks
    AsyncStorage.getItem(`game_dlcs_${gameId}`).then(val => {
      if (val) {
        try {
          const arr = JSON.parse(val);
          const map = {};
          arr.forEach(id => { map[id] = true; });
          setCheckedDlcs(map);
        } catch {}
      }
    });

    // Fetch DLCs
    if (igdbId) {
      setIsLoadingDlcs(true);
      getGameDLCs(igdbId).then(results => {
        setDlcs(results);
        setIsLoadingDlcs(false);
      });
    }
  }, [visible, gameId, igdbId]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 600, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(600);
      onClose?.();
    });
  }, [slideAnim, backdropAnim, onClose]);

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

  const checkedCount = Object.values(checkedDlcs).filter(Boolean).length;

  if (!visible) return null;

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
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
          pointerEvents="box-only"
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.completeIcon}>
                <Ionicons name="checkmark-circle" size={20} color={COMPLETE} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Game Completed!</Text>
                <Text style={styles.headerSub} numberOfLines={1}>{gameName}</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={MUTED} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Playtime ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={15} color={ACCENT} />
                <Text style={styles.sectionTitle}>Time Spent</Text>
              </View>
              <View style={styles.timeInputRow}>
                <TextInput
                  style={styles.timeInput}
                  value={hours}
                  onChangeText={setHours}
                  placeholder="0"
                  placeholderTextColor="#444"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  maxLength={6}
                  accessibilityLabel="Hours played"
                />
                <Text style={styles.timeUnit}>hours</Text>
              </View>
            </View>

            {/* ── DLC Tracker ── */}
            {(isLoadingDlcs || dlcs.length > 0) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="extension-puzzle-outline" size={15} color={ACCENT} />
                  <Text style={styles.sectionTitle}>DLC & Expansions</Text>
                  {dlcs.length > 0 && (
                    <Text style={styles.dlcProgress}>
                      {checkedCount}/{dlcs.length}
                    </Text>
                  )}
                </View>

                {isLoadingDlcs ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={ACCENT} />
                    <Text style={styles.loadingText}>Searching for DLC…</Text>
                  </View>
                ) : dlcs.length === 0 ? (
                  <Text style={styles.noDlcText}>No DLC found for this game.</Text>
                ) : (
                  <>
                    {/* Progress bar */}
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: dlcs.length > 0 ? `${(checkedCount / dlcs.length) * 100}%` : '0%' },
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
            )}

            {dlcs.length === 0 && !isLoadingDlcs && igdbId && (
              <Text style={styles.noDlcNote}>✓ No additional DLC found for this game.</Text>
            )}
          </ScrollView>

          {/* Save button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Save and close"
            >
              {isSaving
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={styles.saveBtnText}>Save & Close</Text>}
            </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.72)',
  },

  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },

  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  completeIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  headerSub: { fontSize: 12, color: MUTED, marginTop: 1, maxWidth: 220 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },

  // ── Sections ──
  section: {
    marginBottom: 20,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  dlcProgress: {
    fontSize: 11,
    color: COMPLETE,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Playtime input ──
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 28,
    fontWeight: '800',
    color: TEXT,
    minWidth: 100,
    textAlign: 'center',
  },
  timeUnit: {
    fontSize: 16,
    color: MUTED,
    fontWeight: '600',
  },

  // ── Progress bar ──
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COMPLETE,
    borderRadius: 2,
  },

  // ── DLC rows ──
  dlcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dlcRowChecked: {
    opacity: 0.65,
  },
  dlcCover: {
    width: 36,
    height: 48,
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
  dlcName: { fontSize: 13, color: TEXT, fontWeight: '600', marginBottom: 4 },
  dlcMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dlcTag: {
    fontSize: 9, fontWeight: '800', color: ACCENT,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  dlcYear: { fontSize: 10, color: MUTED },

  checkbox: {
    width: 22, height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COMPLETE,
    borderColor: COMPLETE,
  },

  // ── States ──
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: MUTED },
  noDlcText: { fontSize: 13, color: MUTED, fontStyle: 'italic' },
  noDlcNote: { fontSize: 12, color: '#444', textAlign: 'center', marginBottom: 12 },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
});

export default CompletedGameSheet;
