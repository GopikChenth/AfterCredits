import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { getMediaTheme } from '../utils/mediaThemes';
import { updateAnonymousMode, updateProfile } from '../services/profile';
import { signOut } from '../services/auth';
import { getPublicName, getFirstName } from '../utils/userUtils';
import { getSettings, updateSettings, getIGDBCredentials, saveIGDBCredentials } from '../services/settings';
import { checkIGDBHealth } from '../services/api_igdb';
import EditProfileModal from '../components/profile_page/EditProfileModal';
import SkeletonProfile from '../components/skeletons/SkeletonProfile';
import { useProfileStore } from '../stores/useProfileStore';

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
    showComics: true,
    showManga: true,
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
  }, [profile]);

  // Handle toggle change
  const handleToggleChange = async (value) => {
    setUseDisplayName(value);
    
    const result = await updateAnonymousMode(value);
    
    if (!result.success) {
      // Revert on error
      setUseDisplayName(!value);
      Alert.alert('Error', 'Failed to update privacy settings');
      return;
    }
    upsertProfile({ use_display_name: value });
  };

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
    const key = `show${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    await updateSettings(newSettings);
  };

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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView 
        style={styles.scrollView}
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
              
              <Text style={styles.loginPromptTitle}>Who Goes There? 🕵️</Text>
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
            {/* Media Visibility Settings */}
            <Text style={styles.sectionTitle}>Sidebar</Text>
            
            <View style={styles.menuCard}>
              {/* Anime Toggle */}
              <View style={styles.menuItem}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={styles.mediaIcon}>🎌</Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Anime</Text>
                  <Text style={styles.menuSubtitle}>
                    {settings.showAnime ? 'Visible' : 'Hidden'}
                  </Text>
                </View>
                <Switch
                  value={settings.showAnime}
                  onValueChange={(value) => handleMediaToggle('anime', value)}
                  trackColor={{ false: '#444', true: theme.accent + '80' }}
                  thumbColor={settings.showAnime ? theme.accent : '#999'}
                />
              </View>

              <View style={styles.menuDivider} />

              {/* Movies Toggle */}
              <View style={styles.menuItem}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={styles.mediaIcon}>🎬</Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Movies</Text>
                  <Text style={styles.menuSubtitle}>
                    {settings.showMovies ? 'Visible' : 'Hidden'}
                  </Text>
                </View>
                <Switch
                  value={settings.showMovies}
                  onValueChange={(value) => handleMediaToggle('movies', value)}
                  trackColor={{ false: '#444', true: theme.accent + '80' }}
                  thumbColor={settings.showMovies ? theme.accent : '#999'}
                />
              </View>

              <View style={styles.menuDivider} />

              {/* Games Toggle */}
              <View style={styles.menuItem}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={styles.mediaIcon}>🎮</Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Games</Text>
                  <Text style={styles.menuSubtitle}>
                    {settings.showGames ? 'Visible' : 'Hidden'}
                  </Text>
                </View>
                <Switch
                  value={settings.showGames}
                  onValueChange={(value) => handleMediaToggle('games', value)}
                  trackColor={{ false: '#444', true: theme.accent + '80' }}
                  thumbColor={settings.showGames ? theme.accent : '#999'}
                />
              </View>

              <View style={styles.menuDivider} />

              {/* Comics Toggle */}
              <View style={styles.menuItem}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={styles.mediaIcon}>📚</Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Comics</Text>
                  <Text style={styles.menuSubtitle}>
                    {settings.showComics ? 'Visible' : 'Hidden'}
                  </Text>
                </View>
                <Switch
                  value={settings.showComics}
                  onValueChange={(value) => handleMediaToggle('comics', value)}
                  trackColor={{ false: '#444', true: theme.accent + '80' }}
                  thumbColor={settings.showComics ? theme.accent : '#999'}
                />
              </View>

              <View style={styles.menuDivider} />

              {/* Manga Toggle */}
              <View style={styles.menuItem}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={styles.mediaIcon}>📖</Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Manga</Text>
                  <Text style={styles.menuSubtitle}>
                    {settings.showManga ? 'Visible' : 'Hidden'}
                  </Text>
                </View>
                <Switch
                  value={settings.showManga}
                  onValueChange={(value) => handleMediaToggle('manga', value)}
                  trackColor={{ false: '#444', true: theme.accent + '80' }}
                  thumbColor={settings.showManga ? theme.accent : '#999'}
                />
              </View>
            </View>



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
              <Pressable style={styles.menuItem}>
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

        {/* Sync Section */}
        <Text style={styles.sectionTitle}>Sync</Text>
        
        <View style={styles.menuCard}>
          {/* Connect Account */}
          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="key-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Connect Account</Text>
              <Text style={styles.menuSubtitle}>Connect account and sync your library</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </Pressable>
        </View>

        {/* Backlog Section */}
        <Text style={styles.sectionTitle}>Backlog</Text>
        
        <View style={styles.menuCard}>
          {/* Custom Statuses */}
          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="flag-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <View style={styles.menuTitleRow}>
                <Text style={styles.menuTitle}>Custom Statuses</Text>
                <View style={[styles.newBadge, { backgroundColor: theme.accent }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={styles.menuSubtitle}>Create custom tracking statuses</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </Pressable>
        </View>

        {/* App Info Section */}
        <Text style={styles.sectionTitle}>App</Text>
        
        <View style={styles.menuCard}>
          {/* About */}
          <Pressable style={styles.menuItem}>
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
    backgroundColor: '#0D0D0D',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  loginPromptCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    borderColor: '#252525',
  },
  questionMarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginPromptSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
  },
  menuCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    borderCurve: 'continuous',
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaIcon: {
    fontSize: 18,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginLeft: 70,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
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
    fontWeight: '700',
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
    color: '#bbb',
    lineHeight: 18,
  },
  igdbFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 6,
    marginTop: 2,
  },
  igdbInput: {
    backgroundColor: '#0D0D0D',
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#333',
    color: '#FFFFFF',
    fontSize: 14,
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

