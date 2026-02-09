import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMediaType } from '../../context/MediaTypeContext';

const NavBar = ({ activeTab = 'home', onTabChange }) => {
  const [active, setActive] = useState(activeTab);
  const navigation = useNavigation();
  const { getHomeRoute } = useMediaType();

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'discover', label: 'Discover', icon: '🔍' },
    { id: 'podium', label: 'Podium', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const handleTabPress = (tabId) => {
    setActive(tabId);
    
    // Navigate based on tab
    if (tabId === 'home') {
      // Navigate to appropriate home page based on media type
      const homeRoute = getHomeRoute();
      navigation.navigate(homeRoute);
    } else if (tabId === 'profile') {
      navigation.navigate('ProfilePage');
    }
    // Add other tab navigation here as needed
    
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => handleTabPress(tab.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{tab.icon}</Text>
          <Text style={[
            styles.label,
            active === tab.id && styles.activeLabel
          ]}>
            {tab.label}
          </Text>
          {active === tab.id && <View style={styles.indicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopWidth: 0,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#FFB3C6',
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 3,
    backgroundColor: '#FFB3C6',
    borderRadius: 2,
  },
});

export default NavBar;
