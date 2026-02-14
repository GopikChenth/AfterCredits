import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

/**
 * Custom Tab Bar for Bottom Tab Navigator
 * Receives props from @react-navigation/bottom-tabs
 */
const NavBar = ({ state, descriptors, navigation }) => {
  const tabConfig = {
    HomeAnime: { label: 'Home', icon: '🏠' },
    PostPage: { label: 'Post', icon: '📝' },
    DiscoverPage: { label: 'Discover', icon: '🔍' },
    PodiumPage: { label: 'Podium', icon: '📋' },
  };

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const config = tabConfig[route.name];
        if (!config) return null;
        
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={onPress}
          >
            <Text style={styles.icon}>{config.icon}</Text>
            <Text style={[
              styles.label,
              isFocused && styles.activeLabel
            ]}>
              {config.label}
            </Text>
            {isFocused && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
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