import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const NavBar = ({ activeTab = 'Home', onTabChange }) => {
  const [active, setActive] = useState(activeTab);

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const handleTabPress = (tabId) => {
    setActive(tabId);
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 10,
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#666',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#FFB3C6', // Pastel Pink
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 3,
    backgroundColor: '#FFB3C6', // Pastel Pink
    borderRadius: 2,
  },
});

export default NavBar;
