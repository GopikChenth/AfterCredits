import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { getMediaTheme } from '../utils/mediaThemes';
import { updateAnonymousMode, updateProfile } from '../services/profile';
import { signOut } from '../services/auth';
import { getPublicName, getFirstName } from '../utils/userUtils';
import { getSettings, updateSettings, getIGDBCredentials, saveIGDBCredentials } from '../services/settings';
import { checkIGDBHealth } from '../services/api_igdb';
import EditProfileModal from '../components/profile_page/EditProfileModal';
import SkeletonProfile from '../components/skeletons/SkeletonProfile';
import { useProfileStore } from '../stores/useProfileStore';

const ANON_MODE_SAVE_DEBOUNCE_MS = 220;
const SIDEBAR_MEDIA_OPTIONS = [
  { id: 'anime', key: 'showAnime', title: 'Anime', icon: 'sparkles-outline' },
  { id: 'movies', key: 'showMovies', title: 'Movies', icon: 'film-outline' },
  { id: 'games', key: 'showGames', title: 'Games', icon: 'game-controller-outline' },
  { id: 'comics', key: 'showComics', title: 'Comics', icon: 'book-outline', locked: true },
  { id: 'manga', key: 'showManga', title: 'Manga', icon: 'albums-outline', locked: true },
];
const SIDEBAR_REORDER_TRANSITION = LinearTransition.springify()
  .damping(18)
  .stiffness(220)
  .mass(0.7);
const SIDEBAR_DRAG_ROW_HEIGHT = 44;
const SIDEBAR_DRAG_DEADZONE = 10;
const SIDEBAR_DRAG_SPRING = {
  damping: 18,
  stiffness: 220,
  mass: 0.7,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const moveArrayItem = (arr, fromIndex, toIndex) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return arr;
  const next = [...arr];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const getActiveSidebarIdsFromSettings = (settings) => {
  const enabledIds = SIDEBAR_MEDIA_OPTIONS
    .filter((item) => !item.locked && Boolean(settings?.[item.key]))
    .map((item) => item.id);

  const enabledSet = new Set(enabledIds);
  const currentOrder = Array.isArray(settings?.sidebarOrder) ? settings.sidebarOrder : [];
  const orderedEnabled = currentOrder.filter((id) => enabledSet.has(id));
  const missing = enabledIds.filter((id) => !orderedEnabled.includes(id));
  return [...orderedEnabled, ...missing];
};

const reorderOnlyActiveSidebarItems = (sidebarOrder, activeIdsInOrder, fromIndex, toIndex) => {
  if (!Array.isArray(sidebarOrder) || activeIdsInOrder.length <= 1 || fromIndex === toIndex) {
    return sidebarOrder;
  }

  const movedActiveIds = moveArrayItem(activeIdsInOrder, fromIndex, toIndex);
  const activeSet = new Set(activeIdsInOrder);
  let replacementIndex = 0;

  return sidebarOrder.map((id) => {
    if (!activeSet.has(id)) return id;
    const nextId = movedActiveIds[replacementIndex];
    replacementIndex += 1;
    return nextId;
  });
};

const SidebarDragHandle = React.memo(({
  itemId,
  disabled,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isDragging) {
      scale.value = withSpring(1, SIDEBAR_DRAG_SPRING);
    }
  }, [isDragging, scale]);

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onBegin(() => {
          scale.value = withSpring(1.08, SIDEBAR_DRAG_SPRING);
          runOnJS(onDragStart)(itemId);
        })
        .onUpdate((event) => {
          runOnJS(onDragMove)(event.translationY);
        })
        .onFinalize(() => {
          scale.value = withSpring(1, SIDEBAR_DRAG_SPRING);
          runOnJS(onDragEnd)();
        }),
    [disabled, itemId, onDragEnd, onDragMove, onDragStart, scale]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View
        style={[
          styles.dragHandle,
          styles.dragHandleInline,
          disabled && styles.dragHandleDisabled,
          isDragging && styles.dragHandleActive,
          animatedStyle,
        ]}
      >
        <Ionicons
          name="reorder-three-outline"
          size={20}
          color={
            isDragging
              ? '#FFFFFF'
              : disabled
              ? 'rgba(183,190,208,0.35)'
              : '#B7BED0'
          }
        />
      </Animated.View>
    </GestureDetector>
  );
});

const ProfilePage = ({ navigation }) => {
  const theme = getMediaTheme('anime');
  const [useDisplayName, setUseDisplayName] = useState(false);
  const profile = useProfileStore((state) => state.profile);
  const loading = useProfileStore((state) => state.loading);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const upsertProfile = useProfileStore((state) => state.upsertProfile);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // IGDB health check
  const [igdbStatus, setIgdbStatus] = useState(null); // null | 'checking' | { ok, message }

  // IGDB credentials modal
  const [showIGDBModal, setShowIGDBModal] = useState(false);
  const [igdbClientId, setIgdbClientId] = useState('');
  const [igdbAccessToken, setIgdbAccessToken] = useState('');
  const [igdbCredentialsSaved, setIgdbCredentialsSaved] = useState(false); // whether non-empty creds are stored
  const [isSavingIGDB, setIsSavingIGDB] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    showAnime: true,
    showMovies: true,
    showGames: true,
    showComics: false,
    showManga: false,
    sidebarOrder: ['anime', 'movies', 'games', 'comics', 'manga'],
  });
  const [draggingSidebarId, setDraggingSidebarId] = useState(null);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const anonModeTimerRef = useRef(null);
  const anonModePendingValueRef = useRef(null);
  const anonModeInFlightRef = useRef(false);
  const anonModeLastSavedRef = useRef(false);
  const isMountedRef = useRef(true);
  const latestSettingsRef = useRef(settings);
  const sidebarDragRef = useRef({
    itemId: null,
    startIndex: -1,
    currentIndex: -1,
    activeCount: 0,
    hasMoved: false,
  });

  // Reload profile every time screen gains focus (handles login/logout)
  const loadSettings = useCallback(async () => {
    const userSettings = await getSettings();
    setSettings(userSettings);
    // Load stored IGDB credentials
    const creds = await getIGDBCredentials();
    setIgdbClientId(creds.clientId || '');
    setIgdbAccessToken(creds.accessToken || '');
    setIgdbCredentialsSaved(!!(creds.clientId && creds.accessToken));
  }, []);

  const loadProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadSettings();
    }, [loadProfile, loadSettings])
  );

  useEffect(() => {
    setUseDisplayName(profile?.use_display_name || false);
    anonModeLastSavedRef.current = Boolean(profile?.use_display_name);
  }, [profile]);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (anonModeTimerRef.current) {
        clearTimeout(anonModeTimerRef.current);
        anonModeTimerRef.current = null;
      }
    };
  }, []);

  const flushAnonymousModeUpdate = useCallback(async () => {
    if (anonModeInFlightRef.current) return;
    anonModeInFlightRef.current = true;

    let shouldShowError = false;
    while (typeof anonModePendingValueRef.current === 'boolean') {
      const nextValue = anonModePendingValueRef.current;
      anonModePendingValueRef.current = null;

      if (nextValue === anonModeLastSavedRef.current) continue;

      const previousValue = anonModeLastSavedRef.current;
      const result = await updateAnonymousMode(nextValue);

      if (!result.success) {
        shouldShowError = true;
        if (isMountedRef.current) {
          setUseDisplayName(previousValue);
        }
        anonModePendingValueRef.current = null;
        break;
      }

      anonModeLastSavedRef.current = nextValue;
      if (isMountedRef.current) {
        upsertProfile({ use_display_name: nextValue });
      }
    }

    anonModeInFlightRef.current = false;

    if (shouldShowError && isMountedRef.current) {
      Alert.alert('Error', 'Failed to update privacy settings');
    }

    if (typeof anonModePendingValueRef.current === 'boolean' && isMountedRef.current) {
      flushAnonymousModeUpdate();
    }
  }, [upsertProfile]);

  // Handle toggle change
  const handleToggleChange = useCallback((value) => {
    setUseDisplayName(value);
    anonModePendingValueRef.current = value;

    if (anonModeTimerRef.current) {
      clearTimeout(anonModeTimerRef.current);
    }

    anonModeTimerRef.current = setTimeout(() => {
      anonModeTimerRef.current = null;
      flushAnonymousModeUpdate();
    }, ANON_MODE_SAVE_DEBOUNCE_MS);
  }, [flushAnonymousModeUpdate]);

  // Handle Logout
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              clearProfile();
              setUseDisplayName(false);
              navigation.navigate('AuthPage');
            } else {
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ],
    );
  };

  // Handle Save Profile
  const handleSaveProfile = async (updates) => {
    const result = await updateProfile(updates);
    
    if (result.success && result.profile) {
      upsertProfile(result.profile);
      setUseDisplayName(result.profile.use_display_name || false);
    }
    
    return result;
  };

  // Handle Media Visibility Toggle
  const handleMediaToggle = async (mediaType, value) => {
    if (mediaType === 'comics' || mediaType === 'manga') {
      return;
    }
    const key = `show${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    await updateSettings(newSettings);
  };

  const orderedSidebarOptions = useMemo(() => {
    const order = Array.isArray(settings.sidebarOrder) ? settings.sidebarOrder : [];
    const rank = new Map(order.map((id, index) => [id, index]));
    return [...SIDEBAR_MEDIA_OPTIONS].sort((a, b) => {
      const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
      const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
      return aRank - bRank;
    });
  }, [settings.sidebarOrder]);

  const activeSidebarIds = useMemo(
    () => getActiveSidebarIdsFromSettings(settings),
    [settings]
  );

  const beginSidebarDrag = useCallback((itemId) => {
    const currentSettings = latestSettingsRef.current;
    const activeIds = getActiveSidebarIdsFromSettings(currentSettings);
    const startIndex = activeIds.indexOf(itemId);

    if (startIndex < 0 || activeIds.length <= 1) return false;

    sidebarDragRef.current = {
      itemId,
      startIndex,
      currentIndex: startIndex,
      activeCount: activeIds.length,
      hasMoved: false,
    };
    setDraggingSidebarId(itemId);
    setIsSidebarDragging(true);
    return true;
  }, []);

  const moveSidebarDrag = useCallback((dy) => {
    const dragState = sidebarDragRef.current;
    if (!dragState.itemId) return;

    if (Math.abs(dy) < SIDEBAR_DRAG_DEADZONE) return;

    const nextIndex = clamp(
      dragState.startIndex + Math.round(dy / SIDEBAR_DRAG_ROW_HEIGHT),
      0,
      dragState.activeCount - 1
    );

    if (nextIndex === dragState.currentIndex) return;

    setSettings((prev) => {
      const activeIds = getActiveSidebarIdsFromSettings(prev);
      const nextSidebarOrder = reorderOnlyActiveSidebarItems(
        prev.sidebarOrder,
        activeIds,
        dragState.currentIndex,
        nextIndex
      );

      if (nextSidebarOrder === prev.sidebarOrder) return prev;

      const nextSettings = { ...prev, sidebarOrder: nextSidebarOrder };
      latestSettingsRef.current = nextSettings;
      return nextSettings;
    });

    sidebarDragRef.current = {
      ...dragState,
      currentIndex: nextIndex,
      hasMoved: true,
    };
  }, []);

  const endSidebarDrag = useCallback(async () => {
    const dragState = sidebarDragRef.current;
    const didDrag =
      Boolean(dragState.itemId) &&
      dragState.hasMoved &&
      dragState.startIndex !== dragState.currentIndex;

    sidebarDragRef.current = {
      itemId: null,
      startIndex: -1,
      currentIndex: -1,
      activeCount: 0,
      hasMoved: false,
    };
    setDraggingSidebarId(null);
    setIsSidebarDragging(false);

    if (!didDrag) return;

    await updateSettings(latestSettingsRef.current);
  }, []);

  const renderSidebarSettings = () => (
    <>
      <Text style={styles.sectionTitle}>Sidebar</Text>
      <View style={styles.menuCard}>
        {orderedSidebarOptions.map((item, index) => {
          const isLocked = Boolean(item.locked);
          const value = isLocked ? false : Boolean(settings[item.key]);
          const isDraggable = activeSidebarIds.length > 1 && !isLocked && value;
          const isDragging = draggingSidebarId === item.id;
          return (
            <Animated.View
              key={item.id}
              layout={SIDEBAR_REORDER_TRANSITION}
            >
              <View
                style={[
                  styles.menuItem,
                  isLocked && styles.menuItemDisabled,
                  isDragging && styles.reorderRowDragging,
                ]}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Ionicons name={item.icon} size={20} color={theme.accent} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={[styles.menuSubtitle, isLocked && styles.menuSubtitleComingSoon]}>
                    {isLocked ? 'Coming soon' : (value ? 'Visible' : 'Hidden')}
                  </Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={(nextValue) => handleMediaToggle(item.id, nextValue)}
                  disabled={isLocked}
                  trackColor={{ false: '#444', true: theme.accent + '80' }}
                  thumbColor={value ? theme.accent : '#999'}
                />
                <SidebarDragHandle
                  itemId={item.id}
                  disabled={!isDraggable}
                  isDragging={isDragging}
                  onDragStart={beginSidebarDrag}
                  onDragMove={moveSidebarDrag}
                  onDragEnd={endSidebarDrag}
                />
              </View>
              {!isLocked && value && activeSidebarIds.length <= 1 ? (
                <Text style={styles.reorderHintSingle}>Enable at least 2 active sidebars to reorder.</Text>
              ) : null}
              {index < orderedSidebarOptions.length - 1 ? <View style={styles.menuDivider} /> : null}
            </Animated.View>
          );
        })}
      </View>
    </>
  );

  // IGDB credentials save handler
  const handleSaveIGDBCredentials = async () => {
    setIsSavingIGDB(true);
    const result = await saveIGDBCredentials({ clientId: igdbClientId, accessToken: igdbAccessToken });
    setIsSavingIGDB(false);
    if (result.success) {
      const hasCredentials = igdbClientId.trim().length > 0 && igdbAccessToken.trim().length > 0;
      setIgdbCredentialsSaved(hasCredentials);
      setIgdbStatus(null); // reset health status so it re-checks with new creds
      setShowIGDBModal(false);
      Alert.alert(
        hasCredentials ? 'Saved' : 'Credentials Cleared',
        hasCredentials
          ? 'IGDB credentials saved. Tap "Check IGDB" to verify them.'
          : 'IGDB credentials have been cleared.'
      );
    } else {
      Alert.alert('Error', 'Failed to save credentials. Please try again.');
    }
  };

  // IGDB health check handler
  const handleCheckIGDB = useCallback(async () => {
    setIgdbStatus('checking');
    const result = await checkIGDBHealth();
    setIgdbStatus(result);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B10" />
      <LinearGradient
        colors={['#0B0B10', '#141421', '#0B0B10']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgGlowOne} />
      <View style={styles.bgGlowTwo} />
      
      <ScrollView 
        style={styles.scrollView}
        scrollEnabled={!isSidebarDragging}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header - ALWAYS SHOW */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Show Empty State if not logged in */}
        {!profile && !loading ? (
          <>
            {/* Login Prompt Card */}
            <View style={styles.loginPromptCard}>
              <View style={styles.emptyStateIconContainer}>
                <Ionicons name="person-circle-outline" size={80} color={theme.accent} />
                <View style={[styles.questionMark, { backgroundColor: theme.accent }]}>
                  <Text style={styles.questionMarkText}>?</Text>
                </View>
              </View>
              
              <Text style={styles.loginPromptTitle}>Who Goes There?</Text>
              <Text style={styles.loginPromptSubtitle}>
                Sign in to unlock your profile, stats & library
              </Text>
              
              <Pressable 
                style={[styles.signInButton, { backgroundColor: theme.accent }]}
                onPress={() => navigation.navigate('AuthPage')}
              >
                <Ionicons name="finger-print" size={20} color="#fff" />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </Pressable>
            </View>
            {renderSidebarSettings()}



            {/* App Settings - Available without login */}
            <Text style={styles.sectionTitle}>App Settings</Text>
            
            <View style={styles.menuCard}>
              {/* Theme (Future) */}
              <Pressable style={styles.menuItem}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Ionicons name="color-palette-outline" size={20} color={theme.accent} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Theme</Text>
                  <Text style={styles.menuSubtitle}>Dark</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>

              <View style={styles.menuDivider} />

              {/* Language (Future) */}
              <Pressable style={styles.menuItem}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Ionicons name="language-outline" size={20} color={theme.accent} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Language</Text>
                  <Text style={styles.menuSubtitle}>English</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>

              <View style={styles.menuDivider} />

              {/* IGDB API Credentials */}
              <Pressable
                style={styles.menuItem}
                onPress={() => setShowIGDBModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Configure IGDB API credentials"
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#A78BFA20' }]}>
                  <Ionicons name="key-outline" size={20} color="#A78BFA" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>IGDB API</Text>
                  <Text style={styles.menuSubtitle}>
                    {igdbCredentialsSaved ? 'Credentials saved' : 'Add your Client ID & Access Token'}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: igdbCredentialsSaved ? '#10B981' : '#EF4444' }]} />
              </Pressable>

              <View style={styles.menuDivider} />

              {/* Check IGDB */}
              <Pressable
                style={styles.menuItem}
                onPress={handleCheckIGDB}
                accessibilityRole="button"
                accessibilityLabel="Check IGDB API connection"
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#A78BFA20' }]}>
                  <Ionicons name="game-controller-outline" size={20} color="#A78BFA" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Check IGDB</Text>
                  <Text style={styles.menuSubtitle}>
                    {igdbStatus === null
                      ? 'Tap to test game details API'
                      : igdbStatus === 'checking'
                      ? 'Checking...'
                      : igdbStatus.message}
                  </Text>
                </View>
                {igdbStatus === 'checking' ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : igdbStatus && igdbStatus.ok !== undefined ? (
                  <View style={[styles.statusDot, { backgroundColor: igdbStatus.ok ? '#10B981' : '#EF4444' }]} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                )}
              </Pressable>

              <View style={styles.menuDivider} />

              {/* About */}
              <Pressable
                style={styles.menuItem}
                onPress={() => navigation.navigate('LegalPage', { documentKey: 'about' })}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Ionicons name="information-circle-outline" size={20} color={theme.accent} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>About</Text>
                  <Text style={styles.menuSubtitle}>Version 1.0.0</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>
            </View>

            {/* Bottom Spacing */}
            <View style={{ height: 100 }} />
          </>
        ) : loading ? (
          <SkeletonProfile />
        ) : (
          <>

        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/png?seed=user123' }}
              style={[styles.avatar, { borderColor: theme.accent }]}
              cachePolicy="memory-disk"
            />
            {/* Edit Button */}
            <Pressable 
              style={[styles.avatarActionLeft, { backgroundColor: theme.accent }]}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </Pressable>
          </View>
          
          {/* User Name */}
          {profile ? (
            <View style={styles.nameContainer}>
              <Text style={styles.displayName}>{getPublicName(profile)}</Text>
              {profile.display_name ? (
                <Text style={styles.subtitle}>
                  {useDisplayName ? `Real name: ${profile.username}` : `Callsign: ${profile.display_name}`}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Sidebar Settings */}
        {renderSidebarSettings()}

        {/* Privacy Section */}
        <Text style={styles.sectionTitle}>Privacy</Text>
        
        <View style={styles.menuCard}>
          {/* Use Display Name Toggle */}
          <View style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="eye-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Anonymous Mode</Text>
              <Text style={styles.menuSubtitle}>
                {useDisplayName 
                  ? 'Others will see your callsign (anonymous)' 
                  : 'Others will see your real name'}
              </Text>
            </View>
            <Switch
              value={useDisplayName}
              onValueChange={handleToggleChange}
              trackColor={{ false: '#E0E0E0', true: theme.accent + '40' }}
              thumbColor={useDisplayName ? theme.accent : '#fff'}
            />
          </View>
        </View>

        {/* App Info Section */}
        <Text style={styles.sectionTitle}>App</Text>
        
        <View style={styles.menuCard}>
          {/* About */}
          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('LegalPage', { documentKey: 'about' })}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="information-circle-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>About</Text>
              <Text style={styles.menuSubtitle}>Version 1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('LegalPage', { documentKey: 'eula' })}
            accessibilityRole="button"
            accessibilityLabel="Open end user license agreement"
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="document-text-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>EULA</Text>
              <Text style={styles.menuSubtitle}>End User License Agreement</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('LegalPage', { documentKey: 'license' })}
            accessibilityRole="button"
            accessibilityLabel="Open source license"
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>License</Text>
              <Text style={styles.menuSubtitle}>Current app source license</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </Pressable>

          <View style={styles.menuDivider} />

          {/* IGDB API Credentials */}
          <Pressable
            style={styles.menuItem}
            onPress={() => setShowIGDBModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Configure IGDB API credentials"
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#A78BFA20' }]}>
              <Ionicons name="key-outline" size={20} color="#A78BFA" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>IGDB API</Text>
              <Text style={styles.menuSubtitle}>
                {igdbCredentialsSaved ? 'Credentials saved' : 'Add your Client ID & Access Token'}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: igdbCredentialsSaved ? '#10B981' : '#EF4444' }]} />
          </Pressable>

          <View style={styles.menuDivider} />

          {/* Check IGDB */}
          <Pressable
            style={styles.menuItem}
            onPress={handleCheckIGDB}
            accessibilityRole="button"
            accessibilityLabel="Check IGDB API connection"
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#A78BFA20' }]}>
              <Ionicons name="game-controller-outline" size={20} color="#A78BFA" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Check IGDB</Text>
              <Text style={styles.menuSubtitle}>
                {igdbStatus === null
                  ? 'Tap to test game details API'
                  : igdbStatus === 'checking'
                  ? 'Checking...'
                  : igdbStatus.message}
              </Text>
            </View>
            {igdbStatus === 'checking' ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : igdbStatus && igdbStatus.ok !== undefined ? (
              <View style={[styles.statusDot, { backgroundColor: igdbStatus.ok ? '#10B981' : '#EF4444' }]} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            )}
          </Pressable>

          <View style={styles.menuDivider} />

          {/* Logout */}
          <Pressable 
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="log-out-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </Pressable>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
        </>
        )}

      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />

      {/* IGDB Credentials Modal */}
      <Modal
        visible={showIGDBModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIGDBModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowIGDBModal(false)}
        >
          <Pressable style={styles.igdbModalCard} onPress={() => {}}>
            {/* Modal Header */}
            <View style={styles.igdbModalHeader}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#A78BFA20', marginRight: 12 }]}>
                <Ionicons name="key-outline" size={20} color="#A78BFA" />
              </View>
              <Text style={styles.igdbModalTitle}>IGDB API Credentials</Text>
              <Pressable onPress={() => setShowIGDBModal(false)} style={styles.igdbModalClose}>
                <Ionicons name="close" size={20} color="#999" />
              </Pressable>
            </View>

            {/* Info Banner */}
            <View style={styles.igdbInfoBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#A78BFA" style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={styles.igdbInfoText}>
                Get a free Client ID and Access Token from{' '}
                <Text style={{ color: '#A78BFA' }}>dev.twitch.tv/console/apps</Text>
                {' '}by registering a new application.
              </Text>
            </View>

            {/* Client ID Field */}
            <Text style={styles.igdbFieldLabel}>Client ID</Text>
            <TextInput
              style={styles.igdbInput}
              value={igdbClientId}
              onChangeText={setIgdbClientId}
              placeholder="Paste your Twitch Client ID"
              placeholderTextColor="#555"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#A78BFA"
            />

            {/* Access Token Field */}
            <Text style={styles.igdbFieldLabel}>Access Token</Text>
            <TextInput
              style={styles.igdbInput}
              value={igdbAccessToken}
              onChangeText={setIgdbAccessToken}
              placeholder="Paste your OAuth Access Token"
              placeholderTextColor="#555"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              selectionColor="#A78BFA"
            />

            {/* Actions */}
            <View style={styles.igdbModalActions}>
              <Pressable
                style={[styles.igdbActionBtn, styles.igdbClearBtn]}
                onPress={() => { setIgdbClientId(''); setIgdbAccessToken(''); }}
              >
                <Text style={styles.igdbClearBtnText}>Clear</Text>
              </Pressable>
              <Pressable
                style={[styles.igdbActionBtn, styles.igdbSaveBtn]}
                onPress={handleSaveIGDBCredentials}
                disabled={isSavingIGDB}
              >
                {isSavingIGDB
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.igdbSaveBtnText}>Save</Text>
                }
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  bgGlowOne: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#A78BFA',
    opacity: 0.14,
  },
  bgGlowTwo: {
    position: 'absolute',
    bottom: -140,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4ADE80',
    opacity: 0.08,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Genjiro',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  loginPromptCard: {
    backgroundColor: '#151521',
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 24,
    marginHorizontal: 8,
    marginVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  emptyStateIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  emptyStateIcon: {
    opacity: 0.8,
  },
  questionMark: {
    position: 'absolute',
    bottom: 5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#151521',
  },
  questionMarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginPromptTitle: {
    fontSize: 20,
    fontFamily: 'Agdasima-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginPromptSubtitle: {
    fontSize: 14,
    color: '#9AA0B4',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Agdasima',
  },
  emptyStateTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderCurve: 'continuous',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Agdasima-Bold',
    letterSpacing: 1,
  },
  emptyStateFooter: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderCurve: 'continuous',
    borderWidth: 3,
  },
  avatarActionLeft: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarActionRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  nameContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  displayName: {
    fontSize: 24,
    fontFamily: 'Agdasima-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9AA0B4',
    fontFamily: 'Agdasima',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderCurve: 'continuous',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Agdasima-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 2,
  },
  reorderRowDragging: {
    backgroundColor: 'rgba(167,139,250,0.16)',
  },
  dragHandle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dragHandleInline: {
    marginLeft: 10,
  },
  dragHandleDisabled: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.04)',
  },
  dragHandleActive: {
    backgroundColor: '#A78BFA',
    borderColor: '#A78BFA',
  },
  reorderHintSingle: {
    fontSize: 11,
    color: '#8FA1BF',
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 70,
    fontFamily: 'Agdasima',
  },
  menuCard: {
    backgroundColor: '#151521',
    borderRadius: 18,
    borderCurve: 'continuous',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemDisabled: {
    opacity: 0.75,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  mediaIcon: {
    fontSize: 18,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Agdasima-Bold',
    color: '#FFFFFF',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#9AA0B4',
    marginTop: 2,
    fontFamily: 'Agdasima',
  },
  menuSubtitleComingSoon: {
    color: '#FBBF24',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 70,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  // ── IGDB Modal ───────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  igdbModalCard: {
    backgroundColor: '#151521',
    borderRadius: 18,
    borderCurve: 'continuous',
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#A78BFA33',
  },
  igdbModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  igdbModalTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Agdasima-Bold',
    color: '#FFFFFF',
  },
  igdbModalClose: {
    padding: 4,
  },
  igdbInfoBanner: {
    flexDirection: 'row',
    backgroundColor: '#A78BFA15',
    borderRadius: 10,
    borderCurve: 'continuous',
    padding: 10,
    marginBottom: 18,
  },
  igdbInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#B7BED0',
    lineHeight: 18,
    fontFamily: 'Agdasima',
  },
  igdbFieldLabel: {
    fontSize: 13,
    fontFamily: 'Agdasima-Bold',
    color: '#D4D8E5',
    marginBottom: 6,
    marginTop: 2,
  },
  igdbInput: {
    backgroundColor: '#0F111A',
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#24273A',
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Agdasima',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  igdbModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  igdbActionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  igdbClearBtn: {
    backgroundColor: '#2A2A2A',
  },
  igdbClearBtnText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
  igdbSaveBtn: {
    backgroundColor: '#A78BFA',
  },
  igdbSaveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProfilePage;

