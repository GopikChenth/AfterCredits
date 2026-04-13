import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { getReviewPageTheme } from '../../stylehandler/reviewPageStyles';

const DateSelector = ({ date, onDateChange, mediaType = 'anime' }) => {
  const theme = getReviewPageTheme(mediaType);
  const [show, setShow] = useState(false);

  // Toggle picker visibility
  const togglePicker = () => {
    setShow((prev) => !prev);
  };

  const handleChange = (event, selectedDate) => {
    // On Android, dismissing gives 'dismissed' action and undefined date
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }

    const currentDate = selectedDate || date;
    
    if (Platform.OS === 'android') {
      setShow(false); // Android picker closes automatically
    }
    
    // Update parent state
    if (currentDate) {
      onDateChange(currentDate);
    }
  };

  // Format date similar to reference: "Sunday 1 February, 2026"
  const formattedDate = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Date Row UI */}
      <View style={styles.row}>
        <Text style={[styles.label, { fontFamily: theme.contentFont }]}>Date</Text>
        
        <Pressable 
          style={styles.datePill} 
          onPress={togglePicker}
        >
          <Text style={[styles.dateValue, { fontFamily: theme.contentFont }]}>
            {formattedDate}
          </Text>
          {/* Calendar or Edit Icon */}
          <Ionicons name="calendar-outline" size={16} color="#999" style={{ marginLeft: 8 }} />
        </Pressable>
      </View>

      {/* Render Picker */}
      {show && (
        <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'inline' : 'default'} // iOS inline calendar style
            onChange={handleChange}
            accentColor={theme.accent} // iOS accent color
            themeVariant="light"
            style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
          />
          
          {/* iOS needs a manual Close button if using inline picker in a custom view */}
          {Platform.OS === 'ios' && (
            <Pressable 
              style={[styles.closeButton, { backgroundColor: theme.accent }]} 
              onPress={() => setShow(false)}
            >
              <Text style={[styles.closeButtonText, { fontFamily: theme.contentFont }]}>
                Done
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#999',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateValue: {
    fontSize: 16,
    color: '#000',
  },
  iosPickerContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  iosPicker: {
    width: '100%',
    backgroundColor: '#fff',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DateSelector;
