import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from "@react-native-picker/picker";
import { launchImageLibrary } from "react-native-image-picker";
import { getAdminProfile } from "./utils/getAdminProfile";

const API_URL = "http://localhost:3000";
//const API_URL = "http://10.24.113.128:3000"
const prayers = ["صلاة نصف الليل", "صلاة السحر", "القداس الالهي", "الساعة الأولى", "الساعة الثالثة", "الساعة السادسة", "الساعة التاسعة", "صلاة الغروب", "صلاة النوم الكبرى", "صلاة المديح", "صلاة السجدة", "القداس السابق تقديسه"];

const AdminDashboard = () => {
  const [assignedChurches, setAssignedChurches] = useState<any[]>([]);
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // shared schedule inputs
  const [schedulePrayer, setSchedulePrayer] = useState("");
  const [scheduleDay, setScheduleDay] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");

  // event inputs
  const [newEventName, setNewEventName] = useState("");
  const [newEventDates, setNewEventDates] = useState<string[]>([]);
  const [newEventTimeFrom, setNewEventTimeFrom] = useState("");
  const [newEventTimeTo, setNewEventTimeTo] = useState("");
  const [newEventType, setNewEventType] = useState(""); // Event type for AI recommendations

  // Event type options for picker (Arabic)
  const eventTypes = ['معارض وحفلات', 'حديث روحي', 'أمسيات', 'حديث اجتماعي'];

  // generate next 7 days (starting tomorrow)
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const dayName = d.toLocaleDateString(undefined, { weekday: "long" });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString(undefined, { month: "short" });
    const display = `${dayName} ${dayNum} ${monthName}`;
    const value = d.toISOString().slice(0, 10); // YYYY-MM-DD
    return { display, value };
  });

  // 24-hour half-hour options
  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m of [0, 30]) {
        const hh = h.toString().padStart(2, "0");
        const mm = m === 0 ? "00" : "30";
        times.push(`${hh}:${mm}`);
      }
    }
    return times;
  };
  const timeOptions = generateTimeOptions();

  // compare helper: dateStr = YYYY-MM-DD, timeStr = HH:MM
  const isDateTimeInFuture = (dateStr: string, timeStr: string) => {
    try {
      const dt = new Date(`${dateStr}T${timeStr}:00`);
      return dt.getTime() > Date.now();
    } catch {
      return false;
    }
  };

  // fetch churches assigned to admin
  useEffect(() => {
    const fetchAssignedChurches = async () => {
      setLoading(true);
      setError("");
      try {
        const profile = await getAdminProfile();
        if (!profile || !profile.fullName) {
          setError("Could not load admin profile");
          setLoading(false);
          return;
        }
        setAdminName(profile.fullName);
        const res = await fetch(`${API_URL}/api/church/assigned/${encodeURIComponent(profile.fullName)}`);
const data = await res.json();
if (!res.ok) {
  setError(data?.error || "Failed to fetch assigned churches");
  setLoading(false);
  return;
}
setAssignedChurches(data.churches || []);
      } catch (err) {
        setError("Could not fetch assigned churches");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedChurches();
  }, []);

  const router = useRouter();
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userProfile');
      await AsyncStorage.removeItem('jwtToken');
    } catch (e) {}
    router.replace('/adminlogin');
  };

  // helper to PATCH a field (schedules/events/images etc.)
  const patchChurch = async (churchId: string, payload: any) => {
    const res = await fetch(`${API_URL}/api/church/ekklesia/${churchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to patch church");
    return data;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Welcome, {adminName || "Admin"}!</Text>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>Loading...</Text>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : assignedChurches.length === 0 ? (
          <Text style={styles.noChurches}>No churches assigned.</Text>
        ) : (
          assignedChurches.map((church, idx) => (
            <View key={church._id || idx} style={styles.churchCard}>
              <Text style={styles.churchName}>{church.name}</Text>

              {/* images horizontal */}
              <ScrollView horizontal style={{ marginVertical: 8 }}>
                {(church.images || []).map((img: string, i: number) => (
                  <View key={i} style={{ marginRight: 6, position: "relative" }}>
                    <Image source={{ uri: img }} style={styles.churchImageSmall} />
                    <TouchableOpacity
                      style={styles.smallDeleteBtn}
                      onPress={async () => {
                        // remove image locally
                        const updated = [...assignedChurches];
                        updated[idx].images = (updated[idx].images || []).filter((_: any, j: number) => j !== i);
                        setAssignedChurches(updated);
                        // patch backend
                        try {
                          await patchChurch(church._id, { images: updated[idx].images });
                        } catch {
                          Alert.alert("Error", "Could not delete image on server");
                        }
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12 }}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.addBtn, { paddingHorizontal: 12 }]}
                  onPress={() =>
                    launchImageLibrary({ mediaType: "photo", quality: 0.7 }, async (res) => {
                      if (res.didCancel) return;
                      if (res.errorCode) {
                        Alert.alert("Error", res.errorMessage || "Could not pick image");
                        return;
                      }
                      const uri = res.assets?.[0].uri || "";
                      const updated = [...assignedChurches];
                      if (!updated[idx].images) updated[idx].images = [];
                      updated[idx].images.push(uri);
                      setAssignedChurches(updated);
                      try {
                        await patchChurch(church._id, { images: updated[idx].images });
                      } catch {
                        Alert.alert("Error", "Could not save image to server");
                      }
                    })
                  }
                >
                  <Text style={styles.addBtnText}>Add Church Image</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* location & about */}
              <TextInput
                style={styles.input}
                placeholder="Location"
                value={church.location}
                onChangeText={(val) => {
                  const updated = [...assignedChurches];
                  updated[idx].location = val;
                  setAssignedChurches(updated);
                }}
              />
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="About"
                value={church.about}
                multiline
                numberOfLines={5}
                onChangeText={(val) => {
                  const updated = [...assignedChurches];
                  updated[idx].about = val;
                  setAssignedChurches(updated);
                }}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  try {
                    await patchChurch(church._id, {
                      location: church.location,
                      about: church.about,
                      images: church.images || [],
                    });
                    Alert.alert("Success", "Church info updated!");
                  } catch {
                    Alert.alert("Error", "Could not update church info");
                  }
                }}
              >
                <Text style={styles.saveBtnText}>Save Info</Text>
              </TouchableOpacity>

              {/* ---------------- SCHEDULE ---------------- */}
              <Text style={styles.sectionTitle}>Add Daily Schedule</Text>

              <View style={styles.pickerContainer}>
                <Picker selectedValue={schedulePrayer} onValueChange={setSchedulePrayer} style={{ height: 40 }}>
                  <Picker.Item label="Select Prayer" value="" />
                  {prayers.map((p, i) => (
                    <Picker.Item key={i} label={p} value={p} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Picker selectedValue={scheduleDay} onValueChange={setScheduleDay} style={{ height: 40 }}>
                  <Picker.Item label="Select Day" value="" />
                  {next7Days.map((d, i) => (
                    <Picker.Item key={i} label={d.display} value={d.value} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Picker selectedValue={scheduleTime} onValueChange={setScheduleTime} style={{ height: 40 }}>
                  <Picker.Item label="Select Time" value="" />
                  {timeOptions.map((t, i) => (
                    <Picker.Item key={i} label={t} value={t} />
                  ))}
                </Picker>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Notes (optional)"
                value={scheduleNotes}
                onChangeText={setScheduleNotes}
              />

              <TouchableOpacity
                style={styles.addBtn}
                onPress={async () => {
                  if (!schedulePrayer || !scheduleDay || !scheduleTime) {
                    Alert.alert("Please fill prayer, day, and time");
                    return;
                  }
                  const updated = [...assignedChurches];
                  if (!updated[idx].schedules) updated[idx].schedules = [];
                  const newSchedule = {
                    name: schedulePrayer,
                    date: scheduleDay,
                    time: scheduleTime,
                    notes: scheduleNotes,
                  };
                  updated[idx].schedules.push(newSchedule);
                  setAssignedChurches(updated);

                  try {
                    await patchChurch(church._id, { schedules: updated[idx].schedules });
                    Alert.alert("Success", "Schedule added!");
                  } catch {
                    Alert.alert("Error", "Could not add schedule");
                  }

                  setSchedulePrayer("");
                  setScheduleDay("");
                  setScheduleTime("");
                  setScheduleNotes("");
                }}
              >
                <Text style={styles.addBtnText}>Add to Schedule</Text>
              </TouchableOpacity>

              {/* Upcoming schedules rendered from original array so index matches */}
              {Array.isArray(church.schedules) && church.schedules.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.sectionTitle}>Upcoming Schedules</Text>
                  {church.schedules.map((s: any, index: number) => {
                    // only render if future
                    if (!isDateTimeInFuture(s.date, s.time)) return null;
                    return (
                      <View key={index} style={styles.scheduleItem}>
                        <Text style={styles.scheduleName}>{s.name}</Text>
                        <Text style={styles.scheduleTime}>
                          {s.date} - {s.time}
                        </Text>
                        {s.notes ? <Text style={styles.scheduleNotes}>{s.notes}</Text> : null}
                        <TouchableOpacity
                          style={[styles.removeBtn, { marginTop: 6 }]}
                          onPress={async () => {
                            // same behaviour as original code: remove by index and patch
                            const updated = [...assignedChurches];
                            updated[idx].schedules = updated[idx].schedules.filter((_: any, i: number) => i !== index);
                            setAssignedChurches(updated);
                            try {
                              await patchChurch(church._id, { schedules: updated[idx].schedules });
                              Alert.alert("Success", "Schedule deleted!");
                            } catch {
                              Alert.alert("Error", "Could not delete schedule");
                            }
                          }}
                        >
                          <Text style={styles.removeBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* ---------------- EVENTS ---------------- */}
              <Text style={styles.sectionTitle}>Add Event</Text>

              <TextInput style={styles.input} placeholder="Event Name" value={newEventName} onChangeText={setNewEventName} />

              {/* Event Type Picker */}
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newEventType}
                  onValueChange={(val) => setNewEventType(val)}
                  style={{ height: 40 }}
                >
                  <Picker.Item label="Select Event Type *" value="" />
                  {eventTypes.map((type, i) => (
                    <Picker.Item key={i} label={type} value={type} />
                  ))}
                </Picker>
              </View>
              {newEventType ? (
                <Text style={{ fontSize: 12, color: '#27ae60', marginTop: -8, marginBottom: 8 }}>
                  Type: {newEventType} ✅
                </Text>
              ) : null}

              {/* pick date and append to list */}
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={null}
                  onValueChange={(val) => {
                    if (!val) return;
                    if (!newEventDates.includes(val)) setNewEventDates((p) => [...p, val]);
                  }}
                  style={{ height: 40 }}
                >
                  <Picker.Item label="Select Event Date (add multiple)" value="" />
                  {next7Days.map((d, i) => (
                    <Picker.Item key={i} label={d.display} value={d.value} />
                  ))}
                </Picker>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                  {newEventDates.map((dt, i) => (
                    <TouchableOpacity key={i} onPress={() => setNewEventDates((p) => p.filter((x) => x !== dt))} style={styles.dateChip}>
                      <Text style={{ color: "#fff", fontSize: 13 }}>{dt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 4 }}>
                  <Text style={{ marginBottom: 4, fontWeight: "bold" }}>Time From</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={newEventTimeFrom} onValueChange={setNewEventTimeFrom} style={{ height: 40 }}>
                      <Picker.Item label="Select Start" value="" />
                      {timeOptions.map((t, i) => (
                        <Picker.Item key={i} label={t} value={t} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 4 }}>
                  <Text style={{ marginBottom: 4, fontWeight: "bold" }}>Time To</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={newEventTimeTo} onValueChange={setNewEventTimeTo} style={{ height: 40 }}>
                      <Picker.Item label="Select End" value="" />
                      {timeOptions.map((t, i) => (
                        <Picker.Item key={i} label={t} value={t} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              {/* add/change event image (single) */}
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: "#27ae60" }]}
                onPress={() =>
                  launchImageLibrary({ mediaType: "photo", quality: 0.7 }, (res) => {
                    if (res.didCancel) return;
                    if (res.errorCode) {
                      Alert.alert("Error", res.errorMessage || "Could not pick image");
                      return;
                    }
                    const uri = res.assets?.[0].uri || "";
                    const updated = [...assignedChurches];
                    updated[idx].newEventImage = uri;
                    setAssignedChurches(updated);
                  })
                }
              >
                <Text style={styles.addBtnText}>{church.newEventImage ? "Change Event Image" : "Add Event Image"}</Text>
              </TouchableOpacity>
              {church.newEventImage ? <Text style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Image selected ✅</Text> : null}

              <TouchableOpacity
                style={styles.addBtn}
                onPress={async () => {
                  if (!newEventName || newEventDates.length === 0 || !newEventTimeFrom || !newEventTimeTo || !newEventType) {
                    Alert.alert("Missing Information", "Please fill all event details including event type");
                    return;
                  }
                  const newEvent = {
                    name: newEventName,
                    dates: newEventDates,
                    timeFrom: newEventTimeFrom,
                    timeTo: newEventTimeTo,
                    location: church.location || "",
                    image: church.newEventImage || "",
                    type: newEventType, // Include event type for AI recommendations
                  };
                  const updated = [...assignedChurches];
                  if (!updated[idx].events) updated[idx].events = [];
                  updated[idx].events.push(newEvent);
                  setAssignedChurches(updated);

                  try {
                    await patchChurch(church._id, { events: updated[idx].events });
                    Alert.alert("Success", "Event added successfully!");
                  } catch {
                    Alert.alert("Error", "Could not add event");
                  }

                  // reset
                  setNewEventName("");
                  setNewEventDates([]);
                  setNewEventTimeFrom("");
                  setNewEventTimeTo("");
                  setNewEventType(""); // Reset event type
                  const reset = [...assignedChurches];
                  reset[idx].newEventImage = "";
                  setAssignedChurches(reset);
                }}
              >
                <Text style={styles.addBtnText}>Add Event</Text>
              </TouchableOpacity>

              {/* upcoming events rendered from original array so index matches on delete */}
              {Array.isArray(church.events) && church.events.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.sectionTitle}>Upcoming Events</Text>
                  {church.events.map((ev: any, index: number) => {
                    const hasFutureDate = Array.isArray(ev.dates)
                      ? ev.dates.some((d: string) => {
                        const timeTo = ev.timeTo || ev.timeFrom || "23:59";
                        return isDateTimeInFuture(d, timeTo);
                      })
                      : false;
                    if (!hasFutureDate) return null;

                    return (
                      <View key={index} style={styles.scheduleItem}>
                        {/* Image first */}
                        {ev.image ? (
                          <Image
                            source={{ uri: ev.image }}
                            style={{
                              width: "100%",
                              height: 180,
                              borderRadius: 10,
                              marginBottom: 10,
                            }}
                            resizeMode="cover"
                          />
                        ) : null}

                        {/* Event details */}
                        <View style={{ paddingHorizontal: 6 }}>
                          <Text style={[styles.scheduleName, { marginBottom: 4 }]}>{ev.name}</Text>
                          <Text style={[styles.scheduleTime, { color: "#555" }]}>
                            {(ev.dates || []).join(" - ")} {"\n"}
                            {ev.timeFrom} - {ev.timeTo} {"\n"}
                            {church.name}
                          </Text>
                        </View>

                        {/* Delete button */}
                        <TouchableOpacity
                          style={[styles.removeBtn, { marginTop: 10 }]}
                          onPress={async () => {
                            const updated = [...assignedChurches];
                            updated[idx].events = updated[idx].events.filter((_: any, i: number) => i !== index);
                            setAssignedChurches(updated);
                            try {
                              await patchChurch(church._id, { events: updated[idx].events });
                              Alert.alert("Success", "Event deleted!");
                            } catch {
                              Alert.alert("Error", "Could not delete event");
                            }
                          }}
                        >
                          <Text style={styles.removeBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboard;

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#173B65",
    marginTop: 18,
    marginBottom: 6,
  },
  addBtn: {
    backgroundColor: "#2980b9",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  scheduleItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleName: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#173B65",
  },
  scheduleTime: {
    fontSize: 14,
    color: "#555",
  },
  scheduleNotes: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: "#1F7BC7",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  safe: { flex: 1, backgroundColor: "#f7f9fb" },
  scrollContent: { paddingBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#173B65",
    marginBottom: 8,
    textAlign: "center",
  },
  churchCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: "100%",
  },
  churchName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#173B65",
    marginBottom: 4,
  },
  churchImageSmall: { width: 80, height: 80, borderRadius: 8 },
  smallDeleteBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    padding: 4,
  },
  removeBtn: {
    marginTop: 10,
    backgroundColor: "#e74c3c",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  removeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  dateChip: {
    backgroundColor: "#10a5d8",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  error: { color: "red", marginTop: 16, textAlign: "center", fontWeight: "bold", fontSize: 15 },
  noChurches: { marginTop: 16, color: "#888", fontSize: 15, textAlign: "center", fontStyle: "italic" },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 8 },
  iconButton: { padding: 6, marginLeft: 8 },
});
