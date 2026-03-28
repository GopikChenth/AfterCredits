/**
 * CompletedWindow
 *
 * Centered popup that appears when the user marks a game as Completed.
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
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGameDLCs } from '../../services/api_igdb';

const ACCENT   = '#0FA3B1';
const BG       = '#131313';
const SURFACE  = '#1C1C1C';
const BORDER   = 'rgba(15,163,177,0.18)';
const TEXT     = '#FFFFFF';
const MUTED    = '#777777';
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

// ── Main popup ────────────────────────────────────────────────────────────────
const CompletedWindow = ({ visible, gameId, igdbId, gameName, onClose }) => {
  const scaleAnim    = useRef(new Animated.Value(0.85)).current;
  const opacityAnim  = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const { width: vw } = useWindowDimensions();

  const [hours, setHours]             = useState('');
  const [dlcs, setDlcs]               = useState([]);
  const [checkedDlcs, setCheckedDlcs] = useState({});
  const [isLoadingDlcs, setIsLoadingDlcs] = useState(false);
  const [isSaving, setIsSaving]       = useState(false);

  // ── Animate in + load data ────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
    backdropAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 65, friction: 10, useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1, duration: 220, useNativeDriver: true,
      }),
    ]).start();

    // Restore saved playtime
    AsyncStorage.getItem(`game_playtime_${gameId}`).then(val => setHours(val || ''));

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
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => onClose?.());
  }, [scaleAnim, opacityAnim, backdropAnim, onClose]);

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

  // Popup width: 90% of screen, max 420px
  const popupWidth = Math.min(vw * 0.9, 420);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Popup card */}
        <Animated.View
          style={[
            styles.popup,
            { width: popupWidth },
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },

  // ── Popup card ──
  popup: {
    backgroundColor: BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    maxHeight: '80%',
    overflow: 'hidden',
    // Shadow
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  completeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  headerSub:   { fontSize: 11, color: MUTED, marginTop: 1 },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  dlcBadge: {
    fontSize: 10,
    color: COMPLETE,
    fontWeight: '700',
  },

  // ── Time input ──
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
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
  timeUnit: {
    fontSize: 14,
    color: MUTED,
    fontWeight: '500',
  },

  // ── States ──
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  stateText: {
    fontSize: 12,
    color: MUTED,
    fontStyle: 'italic',
  },

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

  // ── DLC row ──
  dlcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dlcRowChecked: { opacity: 0.5 },
  dlcCover: {
    width: 30,
    height: 40,
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
  dlcName: { fontSize: 12, color: TEXT, fontWeight: '600', lineHeight: 16 },
  dlcMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dlcTag: {
    fontSize: 8, fontWeight: '800', color: ACCENT,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  dlcYear: { fontSize: 9, color: MUTED },
  checkbox: {
    width: 20, height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COMPLETE,
    borderColor: COMPLETE,
  },

  // ── Footer ──
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
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.4,
  },
});

export default CompletedWindow;
