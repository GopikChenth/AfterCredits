import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * StatusTag - Interactive status pill for user's anime status
 * @param {string} label - Display text (e.g., "Watching", "Dropped")
 * @param {string} icon - Ionicons name
 * @param {boolean} isActive - Whether this status is selected
 * @param {function} onPress - Callback when pressed
 * @param {string} color - Accent color for active state
 */
const StatusTag = ({ label, icon, isActive, onPress, color = '#FFB3C6' }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isActive && { backgroundColor: color, borderColor: color }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon} 
        size={18} 
        color={isActive ? '#000' : '#fff'} 
        style={styles.icon}
      />
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
    minWidth: 100,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default StatusTag;
