/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              GAME STAT PAGE                                      ║
 * ║                                                                  ║
 * ║  Shown when tapping a game from Podium Playing/Completed/Dropped ║
 * ║  Displays user-tracking data + essential game info               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  TextInput,
  Alert,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';

import GenrePill from '../components/details_page/GenrePill';
import PlayingWindow from '../components/details_page/PlayingWindow';
import CompletedWindow from '../components/details_page/CompletedWindow';
import { fetchIGDBById, fetchIGDBByName, getGameDLCs } from '../services/api_igdb';
import { hasIGDBCredentials } from '../services/settings';
import {
  getMediaStatus,
  setMediaStatus,
  setWishlist,
} from '../services/mediaStatusService';

let HapticsModule = null;
try {
  const mod = require('@mhpdev/react-native-haptics');
  HapticsModule = mod?.default ?? mod;
} catch (_) {
  HapticsModule = null;
}

// ─── Theme ───────────────────────────────────────────────────────────────────
const ACCENT    = '#0FA3B1';
const BG        = '#0A0A0A';
const SURFACE   = '#141414';
const SURFACE2  = '#1C1C1C';
const BORDER    = 'rgba(255,255,255,0.06)';
const TEXT_CLR  = '#FFFFFF';
const MUTED     = '#666666';
const MUTED_LT  = '#888888';
const PLAYING   = '#FBBF24';
const COMPLETED = '#22D3EE';
const DROPPED   = '#F87171';

const STATUS_COLORS = { watching: PLAYING, watched: COMPLETED, dropped: DROPPED };
const STATUS_LABELS = { watching: 'Playing', watched: 'Completed', dropped: 'Dropped' };
const STATUS_ICONS  = { watching: 'game-controller', watched: 'checkmark-circle', dropped: 'close-circle' };

const PLATFORMS_MAP = {
  pc: { label: 'PC', icon: 'desktop-outline' },
  ps5: { label: 'PS5', icon: 'logo-playstation' },
  ps4: { label: 'PS4', icon: 'logo-playstation' },
  xbox_x: { label: 'Xbox X|S', icon: 'logo-xbox' },
  xbox_one: { label: 'Xbox One', icon: 'logo-xbox' },
  switch: { label: 'Switch', icon: 'game-controller-outline' },
  steam_deck: { label: 'Steam Deck', icon: 'desktop-outline' },
  mobile: { label: 'Mobile', icon: 'phone-portrait-outline' },
  gog: { label: 'GOG', icon: 'storefront-outline' },
  epic: { label: 'Epic', icon: 'storefront-outline' },
};

const USER_MEDIA_DIR = `${FileSystem.documentDirectory}game_media/`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const parseNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

// ─── Section wrapper ─────────────────────────────────────────────────────────
const Section = ({ title, icon, iconColor = ACCENT, children, delay = 0, extra }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(350).easing(Easing.out(Easing.cubic))} style={s.section}>
    <View style={s.sectionHeader}>
      <Ionicons name={icon} size={14} color={iconColor} />
      <Text style={[s.sectionTitle, { color: iconColor }]}>{title}</Text>
      {extra}
    </View>
    {children}
  </Animated.View>
);

// ─── Info chip ───────────────────────────────────────────────────────────────
const InfoChip = ({ icon, label, value, iconLib = 'ion' }) => (
  <View style={s.infoChip}>
    <View style={s.infoChipIcon}>
      {iconLib === 'mci'
        ? <MaterialCommunityIcons name={icon} size={14} color={ACCENT} />
        : <Ionicons name={icon} size={14} color={ACCENT} />
      }
    </View>
    <View style={s.infoChipText}>
      <Text style={s.infoChipLabel}>{label}</Text>
      <Text style={s.infoChipValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
  </View>
);

// ─── Progress bar ────────────────────────────────────────────────────────────
const ProgressBar = ({ label, value, color, onPress }) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(300, withTiming(value, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <Pressable style={s.progressRow} onPress={onPress}>
      <View style={s.progressLabelRow}>
        <Text style={s.progressLabel}>{label}</Text>
        <Text style={[s.progressValue, { color }]}>{value}%</Text>
      </View>
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { backgroundColor: color }, fillStyle]} />
      </View>
    </Pressable>
  );
};

// ─── DLC mini row ────────────────────────────────────────────────────────────
const DlcMiniRow = ({ dlc, completed }) => (
  <View style={[s.dlcRow, completed && s.dlcRowDone]}>
    <Ionicons
      name={completed ? 'checkmark-circle' : 'ellipse-outline'}
      size={16}
      color={completed ? COMPLETED : MUTED}
    />
    <Text style={[s.dlcName, completed && s.dlcNameDone]} numberOfLines={1}>{dlc.name}</Text>
    {dlc.category && <Text style={s.dlcTag}>{dlc.category}</Text>}
  </View>
);

// ─── Screenshot card ─────────────────────────────────────────────────────────
const StatScreenshot = ({ uri, w, h }) => (
  <View style={[s.screenshotCard, { width: w, height: h }]}>
    <Image source={{ uri }} style={s.screenshotImg} contentFit="cover" />
  </View>
);

// ─── User media card ─────────────────────────────────────────────────────────
const UserMediaCard = ({ uri, onDelete }) => (
  <View style={s.userMediaCard}>
    <Image source={{ uri }} style={s.userMediaImg} contentFit="cover" />
    <Pressable style={s.userMediaDelete} onPress={onDelete}>
      <Ionicons name="close-circle" size={20} color="#F87171" />
    </Pressable>
  </View>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const GameStatPage = ({ route, navigation }) => {
  const { gameId, gameName: routeName, coverImage: routeCover, status: routeStatus, igdbId: routeIgdbId } = route.params || {};
  const { width: vw } = useWindowDimensions();

  // ── State ──
  const [igdbData, setIgdbData]               = useState(null);
  const [isLoading, setIsLoading]             = useState(true);
  const [userStatus, setUserStatus]           = useState(routeStatus || null);
  const [isWishlisted, setIsWishlisted]       = useState(false);
  const [storyProgress, setStoryProgress]     = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [platform, setPlatform]               = useState(null);
  const [playtime, setPlaytime]               = useState(null);
  const [userNotes, setUserNotes]             = useState('');
  const [isEditingNotes, setIsEditingNotes]   = useState(false);
  const [dlcs, setDlcs]                       = useState([]);
  const [checkedDlcs, setCheckedDlcs]         = useState({});
  const [userMedia, setUserMedia]             = useState([]);
  const [showPlayingWindow, setShowPlayingWindow]     = useState(false);
  const [showCompletedWindow, setShowCompletedWindow] = useState(false);
  const [rating, setRating]                           = useState(0);

  // ── Derived ──
  const name        = igdbData?.name || routeName || 'Loading…';
  const cover       = igdbData?.coverImage || routeCover;
  const summary     = igdbData?.summary || igdbData?.storyline || '';
  const genres      = igdbData?.genres || [];
  const themes      = igdbData?.themes || [];
  const developers  = igdbData?.developers || [];
  const publishers  = igdbData?.publishers || [];
  const platforms   = igdbData?.platforms || [];
  const screenshots = igdbData?.screenshots || [];
  const releaseDate = igdbData?.releaseDate || 'TBA';
  const statusColor = STATUS_COLORS[userStatus] || ACCENT;
  const statusLabel = STATUS_LABELS[userStatus] || 'Tracked';
  const statusIcon  = STATUS_ICONS[userStatus] || 'bookmark-outline';
  const platformInfo = platform ? PLATFORMS_MAP[platform] : null;

  const screenshotW = vw * 0.7;
  const screenshotH = screenshotW * 0.56;

  // ── Fetch IGDB data ──
  useEffect(() => {
    if (!gameId) return;
    setIsLoading(true);
    hasIGDBCredentials().then(has => {
      if (!has) { setIsLoading(false); return; }
      (routeIgdbId ? fetchIGDBById(routeIgdbId) : fetchIGDBByName(routeName))
        .then(result => { if (result) setIgdbData(result); })
        .catch(err => console.warn('GameStatPage IGDB error:', err.message))
        .finally(() => setIsLoading(false));
    });
  }, [gameId, routeIgdbId, routeName]);

  // ── Fetch DLCs ──
  useEffect(() => {
    const id = igdbData?.igdbId || routeIgdbId;
    if (!id) return;
    getGameDLCs(id).then(r => setDlcs(r || [])).catch(() => {});
  }, [igdbData?.igdbId, routeIgdbId]);

  // ── Load user tracking data from AsyncStorage ──
  const loadUserData = useCallback(async () => {
    if (!gameId) return;
    try {
      const keys = [
        `game_story_progress_${gameId}`,
        `game_overall_progress_${gameId}`,
        `game_platform_${gameId}`,
        `game_playtime_${gameId}`,
        `game_notes_${gameId}`,
        `game_dlcs_${gameId}`,
        `game_rating_${gameId}`,
      ];
      const pairs = await AsyncStorage.multiGet(keys);
      setStoryProgress(parseNum(pairs[0][1]) ?? 0);
      setOverallProgress(parseNum(pairs[1][1]) ?? 0);
      setPlatform(pairs[2][1] || null);
      setPlaytime(parseNum(pairs[3][1]));
      setUserNotes(pairs[4][1] || '');
      try {
        const arr = pairs[5][1] ? JSON.parse(pairs[5][1]) : [];
        const map = {};
        arr.forEach(id => { map[id] = true; });
        setCheckedDlcs(map);
      } catch (_) {}
      setRating(parseNum(pairs[6][1]) ?? 0);
    } catch (err) {
      console.warn('loadUserData error:', err.message);
    }
  }, [gameId]);

  // ── Load user media from file system ──
  const loadUserMedia = useCallback(async () => {
    try {
      const dir = `${USER_MEDIA_DIR}${gameId}/`;
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) return;
      const files = await FileSystem.readDirectoryAsync(dir);
      setUserMedia(files.map(f => `${dir}${f}`));
    } catch (_) {}
  }, [gameId]);

  // ── Load status from Supabase ──
  useEffect(() => {
    if (!gameId) return;
    getMediaStatus('games', gameId).then(r => {
      if (r.success && r.data) {
        setUserStatus(r.data.status);
        setIsWishlisted(r.data.is_wishlisted);
      }
    });
  }, [gameId]);

  useEffect(() => { loadUserData(); loadUserMedia(); }, [loadUserData, loadUserMedia]);
  useFocusEffect(useCallback(() => { loadUserData(); }, [loadUserData]));

  // ── Save notes ──
  const saveNotes = useCallback(async () => {
    setIsEditingNotes(false);
    try {
      if (userNotes.trim()) {
        await AsyncStorage.setItem(`game_notes_${gameId}`, userNotes);
      } else {
        await AsyncStorage.removeItem(`game_notes_${gameId}`);
      }
    } catch (_) {}
  }, [userNotes, gameId]);

  // ── Save rating ──
  const handleRating = useCallback(async (val) => {
    const newRating = val === rating ? 0 : val; // tap same star to clear
    setRating(newRating);
    try {
      if (HapticsModule?.impact) HapticsModule.impact(newRating === 0 ? 'light' : 'medium');
    } catch (_) {}
    try {
      if (newRating > 0) {
        await AsyncStorage.setItem(`game_rating_${gameId}`, String(newRating));
      } else {
        await AsyncStorage.removeItem(`game_rating_${gameId}`);
      }
    } catch (_) {}
  }, [rating, gameId]);

  // ── Add user media ──
  const pickMedia = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      if (result.canceled) return;

      const dir = `${USER_MEDIA_DIR}${gameId}/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      for (const asset of result.assets) {
        const ext = asset.uri.split('.').pop() || 'jpg';
        const dest = `${dir}${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
        await FileSystem.copyAsync({ from: asset.uri, to: dest });
      }
      await loadUserMedia();
    } catch (err) {
      console.warn('pickMedia error:', err.message);
    }
  }, [gameId, loadUserMedia]);

  // ── Delete user media ──
  const deleteMedia = useCallback(async (uri) => {
    Alert.alert('Delete media?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
            setUserMedia(prev => prev.filter(u => u !== uri));
          } catch (_) {}
        }
      },
    ]);
  }, []);

  // ── Close handlers that reload data ──
  const handlePlayingClose = useCallback(() => {
    setShowPlayingWindow(false);
    loadUserData();
  }, [loadUserData]);

  const handleCompletedClose = useCallback(() => {
    setShowCompletedWindow(false);
    loadUserData();
  }, [loadUserData]);

  // ── Mutually exclusive popup opener ──
  const openPopup = useCallback((which) => {
    // Close both first, then open the requested one
    setShowPlayingWindow(false);
    setShowCompletedWindow(false);
    // Use a microtask to ensure the close is processed before opening
    requestAnimationFrame(() => {
      if (which === 'playing')   setShowPlayingWindow(true);
      if (which === 'completed') setShowCompletedWindow(true);
    });
  }, []);

  const checkedCount = Object.keys(checkedDlcs).filter(k => checkedDlcs[k]).length;

  // ── Loading ──
  if (isLoading) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={s.loadingText}>Loading game stats…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HERO ── */}
        <View style={s.hero}>
          {cover ? (
            <Image source={{ uri: cover }} style={s.heroBg} contentFit="cover" blurRadius={20} />
          ) : (
            <View style={[s.heroBg, { backgroundColor: '#111' }]} />
          )}
          <LinearGradient colors={['transparent', 'rgba(10,10,10,0.85)', BG]} style={s.heroGradient} />

          {/* Back + Actions */}
          <View style={s.heroTopBar}>
            <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <View style={s.heroActions}>
              <Pressable style={s.actionBtn} onPress={() => {
                openPopup(userStatus === 'watched' ? 'completed' : 'playing');
              }}>
                <Ionicons name="pencil-outline" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Hero content */}
          <View style={s.heroContent}>
            {cover && (
              <Animated.View entering={FadeIn.duration(400)} style={s.heroCoverWrap}>
                <Image source={{ uri: cover }} style={s.heroCover} contentFit="cover" />
              </Animated.View>
            )}
            <View style={s.heroInfo}>
              <Text style={s.heroName} numberOfLines={2}>{name}</Text>
              <View style={s.heroMeta}>
                <View style={[s.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
                  <Ionicons name={statusIcon} size={12} color={statusColor} />
                  <Text style={[s.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
                {platformInfo && (
                  <View style={s.platformBadge}>
                    <Ionicons name={platformInfo.icon} size={11} color={MUTED_LT} />
                    <Text style={s.platformBadgeText}>{platformInfo.label}</Text>
                  </View>
                )}
              </View>
              {developers.length > 0 && (
                <Text style={s.heroDev} numberOfLines={1}>{developers.join(' · ')}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── QUICK STATS ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.quickStats}>
          <View style={s.quickStatItem}>
            <Text style={[s.quickStatNum, { color: PLAYING }]}>
              {playtime != null ? `${playtime}h` : '—'}
            </Text>
            <Text style={s.quickStatLabel}>Hours</Text>
          </View>
          <View style={s.quickStatDivider} />
          <View style={s.quickStatItem}>
            <Text style={[s.quickStatNum, { color: ACCENT }]}>{storyProgress}%</Text>
            <Text style={s.quickStatLabel}>Story</Text>
          </View>
          <View style={s.quickStatDivider} />
          <View style={s.quickStatItem}>
            <Text style={[s.quickStatNum, { color: '#60A5FA' }]}>{overallProgress}%</Text>
            <Text style={s.quickStatLabel}>Overall</Text>
          </View>
          <View style={s.quickStatDivider} />
          <View style={s.quickStatItem}>
            <Text style={[s.quickStatNum, { color: COMPLETED }]}>{releaseDate}</Text>
            <Text style={s.quickStatLabel}>Released</Text>
          </View>
        </Animated.View>

        {/* ── PROGRESS ── */}
        <Section title="Progress" icon="stats-chart-outline" delay={150}
          extra={
            <Pressable onPress={() => openPopup('playing')}>
              <Text style={s.editLink}>Edit</Text>
            </Pressable>
          }
        >
          <ProgressBar label="Story" value={storyProgress} color={PLAYING} onPress={() => openPopup('playing')} />
          <ProgressBar label="Overall" value={overallProgress} color="#60A5FA" onPress={() => openPopup('playing')} />
        </Section>

        {/* ── ABOUT ── */}
        {summary.length > 0 && (
          <Section title="About" icon="information-circle-outline" delay={200}>
            <Text style={s.aboutText}>{summary}</Text>
          </Section>
        )}

        {/* ── RATING ── */}
        <Section title="My Rating" icon="star-outline" iconColor="#FBBF24" delay={225}>
          <View style={s.ratingRow}>
            {[1, 2, 3, 4, 5].map(star => {
              const filled = rating >= star;
              const halfFilled = rating >= star - 0.5 && rating < star;
              return (
                <TouchableOpacity
                  key={star}
                  activeOpacity={0.7}
                  onPress={() => handleRating(star)}
                  style={s.starBtn}
                >
                  <Ionicons
                    name={filled ? 'star' : halfFilled ? 'star-half' : 'star-outline'}
                    size={32}
                    color={filled || halfFilled ? '#FBBF24' : '#333'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          {rating > 0 && (
            <Text style={s.ratingLabel}>{rating} / 5</Text>
          )}
        </Section>

        {/* ── GAME INFO ── */}
        <Section title="Game Info" icon="grid-outline" delay={250}>
          <View style={s.infoGrid}>
            <InfoChip icon="business-outline" label="Publisher" value={publishers.join(', ')} />
            <InfoChip icon="code-slash-outline" label="Developer" value={developers.join(', ')} />
            <InfoChip icon="calendar-outline" label="Released" value={releaseDate} />
            {playtime != null && <InfoChip icon="time-outline" label="Playtime" value={`${playtime} hours`} />}
            {platformInfo && <InfoChip icon={platformInfo.icon} label="Platform" value={platformInfo.label} />}
          </View>
        </Section>

        {/* ── TAGS ── */}
        {(genres.length > 0 || themes.length > 0) && (
          <Section title="Tags" icon="pricetags-outline" delay={300}>
            <View style={s.tagsWrap}>
              {genres.map((g, i) => (
                <View key={`g-${i}`} style={s.tag}>
                  <Text style={s.tagText}>{g}</Text>
                </View>
              ))}
              {themes.map((t, i) => (
                <View key={`t-${i}`} style={[s.tag, s.tagTheme]}>
                  <Text style={[s.tagText, s.tagThemeText]}>{t}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── SCREENSHOTS ── */}
        {screenshots.length > 0 && (
          <Section title="Screenshots" icon="images-outline" delay={350}>
            <FlatList
              data={screenshots}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => `ss-${i}`}
              renderItem={({ item }) => <StatScreenshot uri={item} w={screenshotW} h={screenshotH} />}
              contentContainerStyle={s.screenshotList}
              snapToInterval={screenshotW + 10}
              decelerationRate="fast"
            />
          </Section>
        )}

        {/* ── DLC ── */}
        {dlcs.length > 0 && (
          <Section title="DLC & Expansions" icon="extension-puzzle-outline" delay={400}
            extra={<Text style={s.dlcBadge}>{checkedCount}/{dlcs.length}</Text>}
          >
            {dlcs.length > 0 && (
              <View style={s.dlcProgressTrack}>
                <View style={[s.dlcProgressFill, { width: `${(checkedCount / dlcs.length) * 100}%` }]} />
              </View>
            )}
            {dlcs.map(dlc => (
              <DlcMiniRow key={dlc.id} dlc={dlc} completed={!!checkedDlcs[dlc.id]} />
            ))}
          </Section>
        )}

        {/* ── USER NOTES ── */}
        <Section title="Notes" icon="document-text-outline" delay={450}
          extra={
            <Pressable onPress={() => isEditingNotes ? saveNotes() : setIsEditingNotes(true)}>
              <Text style={s.editLink}>{isEditingNotes ? 'Save' : 'Edit'}</Text>
            </Pressable>
          }
        >
          {isEditingNotes ? (
            <TextInput
              style={s.notesInput}
              value={userNotes}
              onChangeText={setUserNotes}
              placeholder="Add your notes about this game…"
              placeholderTextColor="#333"
              multiline
              autoFocus
              textAlignVertical="top"
            />
          ) : (
            <Text style={s.notesText}>
              {userNotes || 'No notes yet. Tap Edit to add some.'}
            </Text>
          )}
        </Section>

        {/* ── USER MEDIA ── */}
        <Section title="My Media" icon="camera-outline" delay={500}
          extra={
            <Pressable onPress={pickMedia}>
              <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
            </Pressable>
          }
        >
          {userMedia.length === 0 ? (
            <Pressable style={s.mediaEmptyBtn} onPress={pickMedia}>
              <Ionicons name="cloud-upload-outline" size={24} color={MUTED} />
              <Text style={s.mediaEmptyText}>Add screenshots, clips & more</Text>
              <Text style={s.mediaEmptyHint}>Stored locally on your device</Text>
            </Pressable>
          ) : (
            <View style={s.mediaGrid}>
              {userMedia.map(uri => (
                <UserMediaCard key={uri} uri={uri} onDelete={() => deleteMedia(uri)} />
              ))}
              <Pressable style={s.mediaAddBtn} onPress={pickMedia}>
                <Ionicons name="add" size={28} color={MUTED} />
              </Pressable>
            </View>
          )}
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Popups ── */}
      <PlayingWindow
        visible={showPlayingWindow}
        gameId={String(gameId)}
        gameName={name}
        onClose={handlePlayingClose}
      />
      <CompletedWindow
        visible={showCompletedWindow}
        gameId={String(gameId)}
        igdbId={igdbData?.igdbId || routeIgdbId}
        gameName={name}
        timeToBeat={igdbData?.timeToBeat}
        onClose={handleCompletedClose}
      />
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 20 },

  // ── Loading ──
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: MUTED, fontWeight: '500' },

  // ── Hero ──
  hero: { height: 280, position: 'relative', overflow: 'hidden' },
  heroBg: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroTopBar: {
    position: 'absolute', top: 40, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, zIndex: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  heroActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end', gap: 14,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  heroCoverWrap: {
    width: 90, height: 125, borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12,
    elevation: 10,
  },
  heroCover: { width: '100%', height: '100%' },
  heroInfo: { flex: 1, paddingBottom: 2 },
  heroName: { fontSize: 20, fontWeight: '800', color: TEXT_CLR, lineHeight: 24 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  platformBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  platformBadgeText: { fontSize: 9, fontWeight: '600', color: MUTED_LT },
  heroDev: { fontSize: 11, color: MUTED_LT, marginTop: 4, fontWeight: '500' },

  // ── Quick stats ──
  quickStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURFACE, borderRadius: 14,
    marginHorizontal: 14, marginTop: -10,
    paddingVertical: 14, paddingHorizontal: 6,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 6,
  },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatNum: { fontSize: 16, fontWeight: '900' },
  quickStatLabel: { fontSize: 9, color: MUTED, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  quickStatDivider: { width: 1, height: 28, backgroundColor: BORDER },

  // ── Section ──
  section: {
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    marginHorizontal: 14, marginTop: 12, padding: 14, overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
  },
  sectionTitle: {
    flex: 1, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase',
  },
  editLink: { fontSize: 11, fontWeight: '700', color: ACCENT },

  // ── Progress ──
  progressRow: { marginBottom: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, fontWeight: '600', color: MUTED_LT },
  progressValue: { fontSize: 14, fontWeight: '900' },
  progressTrack: {
    height: 6, backgroundColor: '#1A1A1A', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  // ── About ──
  aboutText: { fontSize: 13, color: MUTED_LT, lineHeight: 20 },

  // ── Rating ──
  ratingRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingVertical: 4,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: 'center', fontSize: 13, fontWeight: '700',
    color: '#FBBF24', marginTop: 8, letterSpacing: 0.5,
  },

  // ── Info Grid ──
  infoGrid: { gap: 8 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0D0D0D', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  infoChipIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: `${ACCENT}12`, alignItems: 'center', justifyContent: 'center',
  },
  infoChipText: { flex: 1 },
  infoChipLabel: { fontSize: 9, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },
  infoChipValue: { fontSize: 13, fontWeight: '600', color: TEXT_CLR, marginTop: 1 },

  // ── Tags ──
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    backgroundColor: `${ACCENT}15`, borderWidth: 1, borderColor: `${ACCENT}30`,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: ACCENT },
  tagTheme: { backgroundColor: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.2)' },
  tagThemeText: { color: '#60A5FA' },

  // ── Screenshots ──
  screenshotList: { gap: 10 },
  screenshotCard: { borderRadius: 10, overflow: 'hidden' },
  screenshotImg: { width: '100%', height: '100%' },

  // ── DLC ──
  dlcBadge: { fontSize: 10, fontWeight: '700', color: COMPLETED },
  dlcProgressTrack: {
    height: 3, backgroundColor: '#1A1A1A', borderRadius: 2, marginBottom: 10, overflow: 'hidden',
  },
  dlcProgressFill: { height: '100%', backgroundColor: COMPLETED, borderRadius: 2 },
  dlcRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  dlcRowDone: { opacity: 0.45 },
  dlcName: { fontSize: 12, fontWeight: '600', color: TEXT_CLR, flex: 1 },
  dlcNameDone: { textDecorationLine: 'line-through' },
  dlcTag: {
    fontSize: 7, fontWeight: '800', color: ACCENT, textTransform: 'uppercase', letterSpacing: 0.8,
    backgroundColor: `${ACCENT}12`, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },

  // ── Notes ──
  notesInput: {
    backgroundColor: '#0D0D0D', borderRadius: 10, borderWidth: 1, borderColor: BORDER,
    padding: 12, fontSize: 13, color: TEXT_CLR, lineHeight: 20, minHeight: 100,
  },
  notesText: { fontSize: 13, color: MUTED_LT, lineHeight: 20, fontStyle: 'italic' },

  // ── User media ──
  mediaEmptyBtn: {
    alignItems: 'center', paddingVertical: 24, gap: 6,
    borderWidth: 1, borderColor: BORDER, borderRadius: 10, borderStyle: 'dashed',
  },
  mediaEmptyText: { fontSize: 12, fontWeight: '600', color: MUTED_LT },
  mediaEmptyHint: { fontSize: 10, color: MUTED },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  userMediaCard: { width: 100, height: 100, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  userMediaImg: { width: '100%', height: '100%' },
  userMediaDelete: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10,
  },
  mediaAddBtn: {
    width: 100, height: 100, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
});

export default GameStatPage;
