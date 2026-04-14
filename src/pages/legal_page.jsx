import React, { useMemo } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LEGAL_DOCUMENTS } from '../constants/legal';
import { getMediaTheme } from '../utils/mediaThemes';

const LegalPage = ({ navigation, route }) => {
  const theme = getMediaTheme('anime');
  const documentKey = route?.params?.documentKey || 'eula';

  const document = useMemo(
    () => LEGAL_DOCUMENTS[documentKey] || LEGAL_DOCUMENTS.eula,
    [documentKey]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B10" />

      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { borderColor: `${theme.accent}35` }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{document.title}</Text>
          <Text style={[styles.updatedAt, { color: theme.accent }]}>
            Updated {document.updatedAt}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {document.sections.map((section) => (
          <View
            key={section.heading}
            style={[styles.sectionCard, { borderColor: `${theme.accent}20` }]}
          >
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171720',
    borderWidth: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Genjiro',
    letterSpacing: 0.8,
  },
  updatedAt: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Agdasima',
    letterSpacing: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#14141C',
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Agdasima-Bold',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  sectionBody: {
    color: '#B8B8C7',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Agdasima',
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 36,
  },
});

export default LegalPage;
