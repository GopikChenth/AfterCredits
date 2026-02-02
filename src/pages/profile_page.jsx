import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMediaTheme } from '../utils/mediaThemes';

const ProfilePage = ({ navigation }) => {
  const theme = getMediaTheme('anime');

  // Static data for UI display
  const streakDays = [
    { day: 'S', active: true },
    { day: 'M', active: true },
    { day: 'T', active: false },
    { day: 'W', active: false },
    { day: 'T', active: false },
    { day: 'F', active: false },
    { day: 'S', active: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily: theme.headingFont }]}>Settings</Text>
          <TouchableOpacity style={[styles.premiumButton, { backgroundColor: theme.accent }]}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.premiumButtonText}>Get Plus+</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=user123' }}
              style={[styles.avatar, { borderColor: theme.accent }]}
            />
            {/* Edit Button */}
            <TouchableOpacity style={[styles.avatarActionLeft, { backgroundColor: theme.accent }]}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
            {/* Verified Badge */}
            <TouchableOpacity style={styles.avatarActionRight}>
              <Ionicons name="checkmark-circle" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {/* Stats Pills */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.statText}>5</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="trophy-outline" size={16} color="#666" />
              <Text style={styles.statText}>4</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.statText}>146h</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="logo-apple" size={18} color="#666" />
            </View>
          </View>
        </View>

        {/* Streak Section */}
        <View style={[styles.card, { backgroundColor: theme.accent + '15' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.streakTitle}>
              <Text style={styles.fireEmoji}>🔥</Text>
              <Text style={[styles.cardTitleText, { fontFamily: theme.contentFont }]}>1 Week Streak</Text>
              <Ionicons name="information-circle-outline" size={16} color="#999" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
          
          <View style={styles.streakDays}>
            {streakDays.map((item, index) => (
              <View key={index} style={styles.streakDayItem}>
                <Text style={styles.streakEmoji}>{item.active ? '🔥' : '⚪'}</Text>
                <Text style={[styles.dayLabel, item.active && { color: theme.accent, fontWeight: '600' }]}>
                  {item.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sync Section */}
        <Text style={[styles.sectionTitle, { fontFamily: theme.headingFont }]}>Sync</Text>
        
        <View style={styles.menuCard}>
          {/* Cloud Sync */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="cloud-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { fontFamily: theme.contentFont }]}>Cloud Sync</Text>
              <Text style={styles.menuSubtitle}>Premium feature - Upgrade to unlock</Text>
            </View>
            <Ionicons name="lock-closed" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Connect Account */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="key-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { fontFamily: theme.contentFont }]}>Connect Account</Text>
              <Text style={styles.menuSubtitle}>Connect account and sync your library</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Backlog Section */}
        <Text style={[styles.sectionTitle, { fontFamily: theme.headingFont }]}>Backlog</Text>
        
        <View style={styles.menuCard}>
          {/* Backlog Settings */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="settings-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { fontFamily: theme.contentFont }]}>Backlog Settings</Text>
              <Text style={styles.menuSubtitle}>Manage backlog preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Custom Statuses */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="flag-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <View style={styles.menuTitleRow}>
                <Text style={[styles.menuTitle, { fontFamily: theme.contentFont }]}>Custom Statuses</Text>
                <View style={[styles.newBadge, { backgroundColor: theme.accent }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={styles.menuSubtitle}>Create custom tracking statuses</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <Text style={[styles.sectionTitle, { fontFamily: theme.headingFont }]}>App</Text>
        
        <View style={styles.menuCard}>
          {/* About */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="information-circle-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { fontFamily: theme.contentFont }]}>About</Text>
              <Text style={styles.menuSubtitle}>Version 1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Logout */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFE5E5' }]}>
              <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { fontFamily: theme.contentFont, color: '#FF6B6B' }]}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    borderWidth: 3,
  },
  avatarActionLeft: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fireEmoji: {
    fontSize: 20,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  streakDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakDayItem: {
    alignItems: 'center',
    gap: 4,
  },
  streakEmoji: {
    fontSize: 24,
  },
  dayLabel: {
    fontSize: 12,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  menuCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
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
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 70,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ProfilePage;
