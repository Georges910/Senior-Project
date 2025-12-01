import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList, Image, Linking,
  Modal, Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,Dimensions
} from "react-native";
import BottomNav from "./Components/BottomNav";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const baseScale = SCREEN_WIDTH / 375;
const rsize = (size: number) => Math.round(size * baseScale);

// ---------- Date Formatter ----------
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short", // Nov, Dec etc.
    year: "numeric",
  });
};
// Helper to check if a schedule is upcoming
const isUpcomingSchedule = (s: any) => {
  if (!s.date || !s.time) return true; // keep if missing info
  const dt = new Date(`${s.date}T${s.time}:00`);
  return dt > new Date();
};

// Helper to check if an event is upcoming
const isUpcomingEvent = (ev: any) => {
  if (!ev.dates) return true;
  // if dates is an array, take the earliest future date
  const datesArray = Array.isArray(ev.dates) ? ev.dates : [ev.dates];
  return datesArray.some((d : String) => new Date(`${d}T${ev.timeFrom || "00:00"}:00`) > new Date());
};

const FindChurchScreen = () => {
  const [search, setSearch] = useState("");
  const [churches, setChurches] = useState<
    Array<{ _id: string; name: string; location?: string; images?: string[] }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedChurch, setSelectedChurch] = useState<any>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const loadCache = async () => {
      let cached: any[] | null = null;
      try {
        if (Platform.OS === "web") {
          const raw = localStorage.getItem("churchesCache");
          if (raw) cached = JSON.parse(raw);
        } else {
          const raw = await AsyncStorage.getItem("churchesCache");
          if (raw) cached = JSON.parse(raw);
        }
      } catch { }
      if (cached && isMounted) {
        setChurches(cached);
        setLoading(false);
      }
    };
    loadCache();

    if (hasFetched.current) return;
    const fetchChurches = async () => {
      try {
        const API_URL = "http://localhost:3000";
        //const API_URL = "http://10.65.189.128:3000";
        const res = await fetch(`${API_URL}/api/church/churches`);
        const data = await res.json();
        if (Array.isArray(data.churches)) {
          setChurches(data.churches);
          if (Platform.OS === "web") {
            localStorage.setItem("churchesCache", JSON.stringify(data.churches));
          } else {
            await AsyncStorage.setItem("churchesCache", JSON.stringify(data.churches));
          }
        } else {
          setChurches([]);
        }
      } catch (err) {
        console.error("Failed to fetch churches:", err);
      } finally {
        if (isMounted) setLoading(false);
        hasFetched.current = true;
      }
    };
    fetchChurches();
    return () => {
      isMounted = false;
    };
  }, []);

  const openLocation = (location?: string) => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    Linking.openURL(url);
  };

  const filteredChurches = churches.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderChurchCard = ({ item }: any) => (
    <View style={styles.card}>
      <Image
        source={{
          uri:
            item.images && item.images.length > 0
              ? item.images[0]
              : "https://raw.githubusercontent.com/midwire/assets/main/church-flat.png",
        }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>

        {item.location ? (
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => openLocation(item.location)}
          >
            <Text style={styles.detailButtonText}>Location</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.detailButton, { marginTop: 6 }]}
          onPress={() => setSelectedChurch(item)}
        >
          <Text style={styles.detailButtonText}>See Detail</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Find a church</Text>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#fff" />
        <TextInput
          style={styles.searchInput}
          placeholder="Find a church"
          placeholderTextColor="#fff"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Churches list */}
      {loading && churches.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Loading...</Text>
        </View>
      ) : filteredChurches.length === 0 && search.trim() !== "" ? (
        <Text style={styles.noResults}>No churches found matching your search.</Text>
      ) : filteredChurches.length === 0 ? (
        <Text style={styles.noResults}>No churches available.</Text>
      ) : (
        <FlatList
          data={filteredChurches}
          keyExtractor={(item) => item._id}
          renderItem={renderChurchCard}
          contentContainerStyle={{ paddingBottom: 90 }}
        />
      )}

      {/* Church Detail Modal */}
      {selectedChurch && (
        <Modal animationType="slide" transparent={true} visible={!!selectedChurch}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                {/* Back button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedChurch(null)}
                >
                  <Ionicons name="arrow-back-outline" size={24} color="#173B65" />
                  <Text style={{ color: "#173B65", marginLeft: 6 }}>Back</Text>
                </TouchableOpacity>

                {/* Title */}
                <Text style={styles.modalTitle}>{selectedChurch.name}</Text>

                {/* Images scroll */}
                {selectedChurch.images && selectedChurch.images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginVertical: 10 }}
                  >
                    {selectedChurch.images.map((img: string, idx: number) => (
                      <Image key={idx} source={{ uri: img }} style={styles.modalImage} />
                    ))}
                  </ScrollView>
                )}

                {/* About */}
                {selectedChurch.about && (
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.sectionText}>{selectedChurch.about}</Text>
                  </View>
                )}

                {/* Schedules */}
{selectedChurch.schedules?.length > 0 && (
  <View style={styles.sectionBox}>
    <Text style={styles.sectionTitle}>Prayer Schedules</Text>
    {selectedChurch.schedules
      .filter(isUpcomingSchedule) // keep only future schedules
      .sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.time}:00`);
        const dateB = new Date(`${b.date}T${b.time}:00`);
        return dateA.getTime() - dateB.getTime();
      }) // sort by date & time
      .map((s: any, i: number) => (
        <View key={i} style={styles.scheduleCard}>
          {s.date && <Text style={styles.scheduleDate}>{formatDate(s.date)}</Text>}
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleTime}>{s.time}</Text>
            <Text style={styles.scheduleName}>{s.name}</Text>
          </View>
          {s.notes && <Text style={styles.scheduleNotes}>{s.notes}</Text>}
        </View>
      ))}
  </View>
)}

{/* Events */}
{selectedChurch.events?.length > 0 && (
  <View style={styles.sectionBox}>
    <Text style={styles.sectionTitle}>Events</Text>
    {selectedChurch.events
      .filter(isUpcomingEvent)
      .map((ev: any, idx: number) => (
        <View key={idx} style={styles.eventCardModal}>
          {ev.image && <View style={styles.eventImageModal}>
      <Image
        source={{ uri: ev.image }}
        style={{ width: "100%", height: "100%", resizeMode: "contain" }}
      />
    </View>}
          <View style={styles.eventDetailsModal}>
            <Text style={styles.eventTitleModal}>{ev.name}</Text>
            <Text style={styles.eventTextModal}>
              {Array.isArray(ev.dates)
                ? ev.dates.filter((d: any) => new Date(`${d}T${ev.timeFrom || '00:00'}:00`) > new Date()).map(formatDate).join(" - ")
                : formatDate(ev.dates)}
            </Text>
            <Text style={styles.eventTextModal}>{ev.timeFrom} - {ev.timeTo}</Text>
            <TouchableOpacity onPress={() => openLocation(ev.location)}>
              <Text style={styles.eventLocation}>{selectedChurch.name}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
  </View>
)}

              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Nav */}
      <BottomNav active="Find Church" />
    </View>
  );
};

export default FindChurchScreen;

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa", paddingHorizontal: 12 },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
    color: "#173B65",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#173B65",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: "#fff", marginLeft: 8 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 2,
  },
  cardImage: {
    width: 100,
    height: "100%",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    resizeMode: "cover",
    backgroundColor: "#eaeaea",
  },
  cardContent: { flex: 1, padding: 10 },
  cardTitle: { fontSize: rsize(12), fontWeight: "bold", marginBottom: 10, color: "#173B65" },
  detailButton: {
    backgroundColor: "#173B65",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detailButtonText: { color: "#fff", fontSize: 12 },
  noResults: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "92%",
    maxHeight: "90%",
    padding: 16,
  },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  modalTitle: {
    fontSize: rsize(12),
    fontWeight: "700",
    color: "#173B65",
    marginBottom: 6,
  },
  modalImage: {
    width: 200,
    height: 120,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: "#eee",
  },
  sectionBox: { marginTop: 10 },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#173B65",
    marginBottom: 6,
  },
  sectionText: { color: "#555", lineHeight: 20 },

  // Schedule
  scheduleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    padding: 10,
    marginBottom: 10,
  },
  scheduleDate: { fontSize: 13, color: "#666", marginBottom: 4 },
  scheduleNotes: { fontSize: 12, fontStyle: "italic", color: "#777", marginTop: 4 },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // keeps them separated
    marginBottom: 2,
  },
  scheduleName: {
    fontWeight: "700",
    color: "#173B65",
    fontSize: 14,
    textAlign: "right", // ensures title stays on the right 
    flexShrink: 1,      // allows wrapping if too long
  },
  scheduleTime: {
    color: "#173B65",
    fontSize: 14,
  },

  // Events
  eventCardModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: "hidden",
    marginBottom: 14,
  },
  eventImageModal: {
    width: "100%",
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: "#f7f7f7",
  overflow: "hidden",          
  justifyContent: "center",  
  alignItems: "center",
  },
  eventDetailsModal: { paddingHorizontal: 12, paddingVertical: 10 },
  eventTitleModal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#173B65",
    marginBottom: 4,
  },
  eventTextModal: { fontSize: 13, color: "#444", marginBottom: 4 },
  eventLocation: {
    fontSize: 13,
    color: "#173B65",
    textDecorationLine: "none",
  },
});
