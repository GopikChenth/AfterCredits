import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image as RNImage,
  ScrollView,
  FlatList,
  StyleSheet,
  StatusBar,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "../components/shared/GlassCard";
import { getStaffDetails } from "../services/api_anilist";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 10;
const NUM_COLUMNS = 3;
const CARD_WIDTH =
  (SCREEN_WIDTH - 32 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const CrewDetailPage = ({ route, navigation }) => {
  const { staffId, staffName } = route.params;
  const [staffData, setStaffData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        const data = await getStaffDetails(staffId);
        setStaffData(data);
      } catch (err) {
        console.error("Failed to fetch staff:", err);
        setError("Failed to load staff details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, [staffId]);

  const formatDate = (dateObj) => {
    if (!dateObj) return null;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const parts = [];
    if (dateObj.month) parts.push(months[dateObj.month - 1]);
    if (dateObj.day) parts.push(dateObj.day);
    if (dateObj.year) parts.push(dateObj.year);
    return parts.join(" ");
  };

  const cleanDescription = (desc) => {
    if (!desc) return null;
    // Remove markdown-style links and clean up
    return desc
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/~!.*?!~/gs, "")
      .trim();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB3C6" />
          <Text style={styles.loadingText}>
            Loading {staffName || "staff"}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !staffData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || "Staff not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const description = cleanDescription(staffData.description);
  const birthday = formatDate(staffData.dateOfBirth);
  const characterRoles = staffData.characterMedia?.edges || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Staff Header */}
        <View style={styles.headerSection}>
          <Image
            source={{ uri: staffData.image?.large || staffData.image?.medium }}
            style={styles.staffImage}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.staffName}>{staffData.name?.full}</Text>
            {staffData.name?.native && (
              <Text style={styles.nativeName}>{staffData.name.native}</Text>
            )}

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              {birthday ? (
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={14} color="#FFB3C6" />
                  <Text style={styles.statText}>{birthday}</Text>
                </View>
              ) : null}
              {staffData.age ? (
                <View style={styles.statItem}>
                  <Ionicons name="person-outline" size={14} color="#FFB3C6" />
                  <Text style={styles.statText}>Age {staffData.age}</Text>
                </View>
              ) : null}
              {staffData.homeTown ? (
                <View style={styles.statItem}>
                  <Ionicons name="location-outline" size={14} color="#FFB3C6" />
                  <Text style={styles.statText}>{staffData.homeTown}</Text>
                </View>
              ) : null}
              {staffData.bloodType ? (
                <View style={styles.statItem}>
                  <Ionicons name="water-outline" size={14} color="#FFB3C6" />
                  <Text style={styles.statText}>
                    Blood: {staffData.bloodType}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Favourites */}
            {staffData.favourites > 0 && (
              <View style={styles.favourites}>
                <Ionicons name="heart" size={14} color="#FF6B6B" />
                <Text style={styles.favouritesText}>
                  {staffData.favourites.toLocaleString()} favourites
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio */}
        {description ? (
          <GlassCard style={styles.bioSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText} numberOfLines={8}>
              {description}
            </Text>
          </GlassCard>
        ) : null}

        {/* Character Roles */}
        {characterRoles.length > 0 && (
          <View style={styles.rolesSection}>
            <Text style={styles.sectionTitle}>
              Voice Acting Roles ({characterRoles.length})
            </Text>

            <FlatList
              data={characterRoles}
              scrollEnabled={false}
              keyExtractor={(_, index) => `role-${index}`}
              renderItem={({ item: edge }) => {
                const anime = edge.node;
                const character = edge.characters?.[0];
                const animeTitle =
                  anime?.title?.english || anime?.title?.romaji || "Unknown";
                const charName = character?.name?.full || "Unknown Character";

                return (
                  <Pressable
                    style={styles.roleCard}
                    onPress={() =>
                      anime?.id &&
                      navigation.push("DetailsAnime", { animeId: anime.id })
                    }
                  >
                    <Image
                      source={{
                        uri:
                          anime?.coverImage?.large || anime?.coverImage?.medium,
                      }}
                      style={styles.animeCover}
                    />

                    <View style={styles.roleInfo}>
                      <Text style={styles.animeTitle} numberOfLines={2}>
                        {animeTitle}
                      </Text>
                      <Text style={styles.characterName} numberOfLines={1}>
                        as {charName}
                      </Text>
                      <View style={styles.roleMetaRow}>
                        {anime?.format && (
                          <Text style={styles.formatTag}>{anime.format}</Text>
                        )}
                        {anime?.seasonYear && (
                          <Text style={styles.yearText}>
                            {anime.seasonYear}
                          </Text>
                        )}
                      </View>
                    </View>

                    {character?.image?.medium && (
                      <Image
                        source={{ uri: character.image.medium }}
                        style={styles.characterImage}
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 15,
    fontFamily: "Agdasima",
  },
  errorText: {
    color: "#888",
    fontSize: 15,
    fontFamily: "Agdasima",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // --- Header ---
  headerSection: {
    flexDirection: "row",
    marginBottom: 20,
  },
  staffImage: {
    width: 110,
    height: 150,
    borderRadius: 10,
    borderCurve: "continuous",
    backgroundColor: "#2A2A2A",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "flex-start",
  },
  staffName: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "Agdasima-Bold",
    color: "#fff",
    lineHeight: 30,
  },
  nativeName: {
    fontSize: 15,
    fontFamily: "Agdasima",
    color: "#888",
    marginTop: 2,
  },
  quickStats: {
    marginTop: 10,
    gap: 5,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: "#CCCCCC",
    fontSize: 13,
    fontFamily: "Agdasima",
  },
  favourites: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  favouritesText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontFamily: "Agdasima",
  },

  // --- Bio ---
  bioSection: {
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 16,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bioText: {
    color: "#BBBBBB",
    fontSize: 14,
    fontFamily: "Agdasima",
    lineHeight: 20,
  },

  // --- Roles ---
  rolesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Agdasima-Bold",
    color: "#fff",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderCurve: "continuous",
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  animeCover: {
    width: 48,
    height: 68,
    borderRadius: 6,
    borderCurve: "continuous",
    backgroundColor: "#2A2A2A",
  },
  roleInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  animeTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Agdasima-Bold",
    color: "#fff",
    lineHeight: 19,
  },
  characterName: {
    fontSize: 13,
    fontFamily: "Agdasima",
    color: "#FFB3C6",
    marginTop: 2,
  },
  roleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  formatTag: {
    fontSize: 11,
    fontFamily: "Agdasima",
    color: "#888",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  yearText: {
    fontSize: 11,
    fontFamily: "Agdasima",
    color: "#888",
  },
  characterImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderCurve: "continuous",
    backgroundColor: "#2A2A2A",
  },
});

export default CrewDetailPage;
