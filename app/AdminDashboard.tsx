import React, { useEffect, useMemo, useState } from "react";
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
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from "@react-native-picker/picker";
import { launchImageLibrary } from "react-native-image-picker";
import { getAdminProfile } from "./utils/getAdminProfile";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const API_URL = "http://localhost:3000";
const prayers = ["صلاة نصف الليل", "صلاة السحر", "القداس الالهي", "الساعة الأولى", "الساعة الثالثة", "الساعة السادسة", "الساعة التاسعة", "صلاة الغروب", "صلاة النوم الكبرى", "صلاة المديح", "صلاة السجدة", "القداس السابق تقديسه"];

// responsive helpers
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const baseScale = SCREEN_WIDTH / 375;
const rsize = (size: number) => Math.round(size * baseScale);

type TimeField = "schedule" | "eventFrom" | "eventTo";

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

  const eventTypes = ['معارض وحفلات', 'حديث روحي', 'أمسيات', 'حديث اجتماعي', 'أفلام روحية'];

  // Time Picker
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<TimeField>("schedule");

  const showTimePicker = (field: TimeField) => {
    setActiveTimeField(field);
    setTimePickerVisible(true);
  };

  const hideTimePicker = () => setTimePickerVisible(false);

  const handleConfirmTime = (date: Date) => {
    const time = date.toTimeString().slice(0, 5); // HH:MM

    if (activeTimeField === "schedule") setScheduleTime(time);
    if (activeTimeField === "eventFrom") setNewEventTimeFrom(time);
    if (activeTimeField === "eventTo") setNewEventTimeTo(time);

    hideTimePicker();
  };

  // generate next 7 days
  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      const dayName = d.toLocaleDateString(undefined, { weekday: "long" });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString(undefined, { month: "short" });
      const display = `${dayName} ${dayNum} ${monthName}`;
      const value = d.toISOString().slice(0, 10); // YYYY-MM-DD
      return { display, value };
    });
  }, []);

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
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const isDateTimeInFuture = (dateStr: string, timeStr: string) => {
    try {
      const dt = new Date(`${dateStr}T${timeStr}:00`);
      return dt.getTime() > Date.now();
    } catch {
      return false;
    }
  };

  const compareTimeStrings = (a: string, b: string) => {
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    if (ah !== bh) return ah - bh;
    return am - bm;
  };

  const timeOptionsAfterFrom = useMemo(() => {
    if (!newEventTimeFrom) return timeOptions;
    return timeOptions.filter(t => compareTimeStrings(t, newEventTimeFrom) > 0);
  }, [newEventTimeFrom, timeOptions]);

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
        const churches = (data.churches || []).map((c: any) => ({
          ...c,
          images: c.images || [],
          events: c.events || [],
          schedules: c.schedules || [],
        }));
        setAssignedChurches(churches);
      } catch {
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
    } catch { }
    router.replace('/adminlogin');
  };

  // helper to PATCH a field
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

  const updateChurchAt = (index: number, change: (c: any) => any) => {
    setAssignedChurches(prev => {
      const copy = [...prev];
      copy[index] = change({ ...(copy[index] || {}) });
      return copy;
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.title}>Admin Dashboard</Text>
              <Text style={styles.subTitle} numberOfLines={1} ellipsizeMode="tail">Welcome, {adminName || "Admin"}!</Text>

            </View>
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={handleLogout} accessibilityLabel="Logout">
            <Ionicons name="log-out-outline" size={rsize(24)} color="#173B65" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.centerHint}>Loading...</Text>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : assignedChurches.length === 0 ? (
          <Text style={styles.noChurches}>No churches assigned.</Text>
        ) : (
          assignedChurches.map((church, idx) => (
            <View key={church._id || idx} style={styles.churchCard}>

              {/* images horizontal (thumbnails) */}
              <ScrollView horizontal style={{ marginVertical: 8 }} showsHorizontalScrollIndicator={false}>
                {(church.images || []).map((img: string, i: number) => (
                  <View key={i} style={{ marginRight: 10, alignItems: "center" }}>
                    <Image
                      source={{ uri: img }}
                      style={styles.churchImageSmall}
                      resizeMode="contain" // show full image
                    />
                    <TouchableOpacity
                      style={styles.smallDeleteBtn}
                      onPress={async () => {
                        // optimistic update
                        updateChurchAt(idx, (c) => {
                          c.images = (c.images || []).filter((_: any, j: number) => j !== i);
                          return c;
                        });
                        try {
                          await patchChurch(church._id, { images: (church.images || []).filter((_: any, j: number) => j !== i) });
                        } catch {
                          Alert.alert("Error", "Could not delete image on server");
                        }
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: rsize(11) }}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.addBtn, { paddingHorizontal: 14, alignSelf: "center", marginRight: 6 }]}
                  onPress={() =>
                    launchImageLibrary({ mediaType: "photo", quality: 0.7 }, async (res) => {
                      if (res.didCancel) return;
                      if (res.errorCode) {
                        Alert.alert("Error", res.errorMessage || "Could not pick image");
                        return;
                      }
                      const uri = res.assets?.[0].uri || "";
                      updateChurchAt(idx, (c) => {
                        if (!c.images) c.images = [];
                        c.images.push(uri);
                        return c;
                      });
                      try {
                        await patchChurch(church._id, { images: [...(church.images || []), uri] });
                      } catch {
                        Alert.alert("Error", "Could not save image to server");
                      }
                    })
                  }
                >
                  <Text style={styles.addBtnText}>Add Image</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Location & About */}
              <TextInput
                style={styles.input}
                placeholder="Location"
                placeholderTextColor="#888"
                value={church.location || ""}
                onChangeText={(val) => {
                  updateChurchAt(idx, (c) => { c.location = val; return c; });
                }}
              />
              <TextInput
                style={[styles.input, { height: rsize(100) }]}
                placeholder="About"
                placeholderTextColor="#888"
                value={church.about || ""}
                multiline
                numberOfLines={4}
                onChangeText={(val) => {
                  updateChurchAt(idx, (c) => { c.about = val; return c; });
                }}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  try {
                    const updated = assignedChurches[idx];
                    await patchChurch(church._id, {
                      location: updated.location,
                      about: updated.about,
                      images: updated.images || [],
                    });
                    Alert.alert("Success", "Church info updated!");
                  } catch {
                    Alert.alert("Error", "Could not update church info");
                  }
                }}
              >
                <Text style={styles.saveBtnText}>Save Info</Text>
              </TouchableOpacity>

              {/* SCHEDULE */}
              <Text style={styles.sectionTitle}>Add Daily Schedule</Text>

              <View style={styles.pickerContainer}>
                <Picker selectedValue={schedulePrayer} onValueChange={setSchedulePrayer} style={styles.picker}>
                  <Picker.Item label="Select Prayer" value="" />
                  {prayers.map((p, i) => (
                    <Picker.Item key={i} label={p} value={p} />
                  ))}
                </Picker>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={scheduleDay} onValueChange={setScheduleDay} style={styles.picker}>
                      <Picker.Item label="Select Day" value="" />
                      {next7Days.map((d, i) => (
                        <Picker.Item key={i} label={d.display} value={d.value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={{ width: rsize(120) }}>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={scheduleTime} onValueChange={setScheduleTime} style={styles.picker}>
                      <Picker.Item label="Time" value="" />
                      {timeOptions.map((t, i) => (
                        <Picker.Item key={i} label={t} value={t} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Notes (optional)"
                placeholderTextColor="#888"
                value={scheduleNotes}
                onChangeText={setScheduleNotes}
              />

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: "#0b84a5" }]}
                onPress={async () => {
                  if (!schedulePrayer || !scheduleDay || !scheduleTime) {
                    Alert.alert("Please fill prayer, day, and time");
                    return;
                  }

                  const newSchedule = {
                    name: schedulePrayer,
                    date: scheduleDay,
                    time: scheduleTime,
                    notes: scheduleNotes,
                  };

                  try {
                    // Patch the server first
                    const updatedSchedules = [...(church.schedules || []), newSchedule];
                    await patchChurch(church._id, { schedules: updatedSchedules });

                    // Update local state after successful server patch
                    updateChurchAt(idx, (c) => {
                      c.schedules = updatedSchedules;
                      return c;
                    });

                    Alert.alert("Success", "Schedule added!");

                    // reset inputs
                    setSchedulePrayer("");
                    setScheduleDay("");
                    setScheduleTime("");
                    setScheduleNotes("");
                  } catch (err) {
                    Alert.alert("Error", "Could not add schedule");
                  }

                  // reset shared inputs
                  setSchedulePrayer("");
                  setScheduleDay("");
                  setScheduleTime("");
                  setScheduleNotes("");
                }}
              >
                <Text style={styles.addBtnText}>Add to Schedule</Text>
              </TouchableOpacity>

              {/* Upcoming Schedules */}
              {Array.isArray(church.schedules) && church.schedules.length > 0 && (
  <View style={{ marginTop: 8 }}>
    <Text style={styles.sectionTitle}>Upcoming Schedules</Text>

    {church.schedules.map((s: any, index: number) => {
      if (!isDateTimeInFuture(s.date, s.time)) return null;

      return (
        <View key={index} style={styles.scheduleItem}>

          {/* DATE (top-left) */}
          <Text style={styles.prayerDate}>{s.date}</Text>

          {/* SAME ROW: TIME (left) — NAME (right) */}
          <View style={styles.timeNameRow}>
            <Text style={styles.prayerTime}>{s.time}</Text>
            <Text style={styles.prayerTitle}>{s.name}</Text>
          </View>

          {/* NOTES (if available) */}
          {s.notes ? (
            <Text style={styles.scheduleNotes}>{s.notes}</Text>
          ) : null}

          {/* DELETE BUTTON */}
          <TouchableOpacity
            style={[styles.removeBtn, { marginTop: 8 }]}
            onPress={async () => {
              const newSchedules = (church.schedules || []).filter(
                (_: any, i: number) => i !== index
              );

              updateChurchAt(idx, (c) => {
                c.schedules = newSchedules;
                return c;
              });

              try {
                await patchChurch(church._id, { schedules: newSchedules });
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

              {/* EVENTS */}
              <Text style={styles.sectionTitle}>Add Event</Text>

              <TextInput
                style={styles.input}
                placeholder="Event Name"
                placeholderTextColor="#888"
                value={newEventName}
                onChangeText={setNewEventName}
              />

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newEventType}
                  onValueChange={(val) => setNewEventType(val)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Event Type *" value="" />
                  {eventTypes.map((type, i) => (
                    <Picker.Item key={i} label={type} value={type} />
                  ))}
                </Picker>
              </View>
              {newEventType ? (
                <Text style={styles.typeBadge}>
                  Type: {newEventType}
                </Text>
              ) : null}

              {/* pick date and append to list */}
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={""}
                  onValueChange={(val) => {
                    if (!val) return;
                    if (!newEventDates.includes(val)) setNewEventDates((p) => [...p, val]);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Event Date (add multiple)" value="" />
                  {next7Days.map((d, i) => (
                    <Picker.Item key={i} label={d.display} value={d.value} />
                  ))}
                </Picker>
              </View>

              {/* Render selected dates below the picker */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                {newEventDates.map((dt, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setNewEventDates((p) => p.filter((x) => x !== dt))}
                    style={styles.dateChip}
                  >
                    <Text style={{ color: "#fff", fontSize: rsize(12) }}>{dt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.row, { alignItems: "flex-start" }]}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={{ marginBottom: 6, fontWeight: "700" }}>Time From</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={newEventTimeFrom} onValueChange={(val) => {
                      setNewEventTimeFrom(val);
                      // reset 'to' if it's now invalid
                      if (newEventTimeTo && val && compareTimeStrings(val, newEventTimeTo) >= 0) {
                        setNewEventTimeTo("");
                      }
                    }} style={styles.picker}>
                      <Picker.Item label="Select Start" value="" />
                      {timeOptions.map((t, i) => (
                        <Picker.Item key={i} label={t} value={t} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ marginBottom: 6, fontWeight: "700" }}>Time To</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={newEventTimeTo} onValueChange={setNewEventTimeTo} style={styles.picker}>
                      <Picker.Item label={newEventTimeFrom ? "Select End" : "Select End"} value="" />
                      {timeOptionsAfterFrom.map((t, i) => (
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
                  launchImageLibrary({ mediaType: "photo", quality: 0.8 }, (res) => {
                    if (res.didCancel) return;
                    if (res.errorCode) {
                      Alert.alert("Error", res.errorMessage || "Could not pick image");
                      return;
                    }
                    const uri = res.assets?.[0].uri || "";
                    updateChurchAt(idx, (c) => { c.newEventImage = uri; return c; });
                  })
                }
              >
                <Text style={styles.addBtnText}>{(church as any).newEventImage ? "Change Event Image" : "Add Event Image"}</Text>
              </TouchableOpacity>
              {(church as any).newEventImage ? <Text style={{ fontSize: rsize(12), color: "#555", marginTop: 6 }}>Image selected ✅</Text> : null}

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: "#0b84a5" }]}
                onPress={async () => {
                  // validation
                  if (!newEventName || newEventDates.length === 0 || !newEventTimeFrom || !newEventTimeTo || !newEventType) {
                    Alert.alert("Missing Information", "Please fill all event details including event type");
                    return;
                  }
                  if (compareTimeStrings(newEventTimeTo, newEventTimeFrom) <= 0) {
                    Alert.alert("Invalid Time", "End time must be after start time (same day).");
                    return;
                  }

                  const newEvent = {
                    name: newEventName,
                    dates: newEventDates,
                    timeFrom: newEventTimeFrom,
                    timeTo: newEventTimeTo,
                    location: church.location || "",
                    image: (church as any).newEventImage || "",
                    type: newEventType,
                  };

                  try {
                    const updatedEvents = [...(church.events || []), newEvent];


                    await patchChurch(church._id, { events: updatedEvents });


                    updateChurchAt(idx, (c) => {
                      c.events = updatedEvents;
                      c.newEventImage = "";
                      return c;
                    });

                    Alert.alert("Success", "Event added successfully!");
                  } catch {
                    Alert.alert("Error", "Could not add event");
                  }

                  // reset global inputs
                  setNewEventName("");
                  setNewEventDates([]);
                  setNewEventTimeFrom("");
                  setNewEventTimeTo("");
                  setNewEventType("");
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
                        {ev.image ? (
                          <Image
                            source={{ uri: ev.image }}
                            style={styles.eventImage}
                            resizeMode="contain"
                          />
                        ) : null}

                        <View style={{ paddingHorizontal: 6 }}>
                          <Text style={[styles.scheduleName, { marginBottom: 6 }]}>{ev.name}</Text>
                          <Text style={[styles.scheduleTime, { color: "#555" }]}>
                            {(ev.dates || []).join(" • ")} {"\n"}
                            {ev.timeFrom} - {ev.timeTo} {"\n"}
                            {church.name}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.removeBtn, { marginTop: 10 }]}
                          onPress={async () => {
                            const updatedEvents = (church.events || []).filter((_: any, i: number) => i !== index);
                            updateChurchAt(idx, (c) => { c.events = updatedEvents; return c; });
                            try {
                              await patchChurch(church._id, { events: updatedEvents });
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
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleConfirmTime}
          onCancel={hideTimePicker}
          is24Hour
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboard;

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f2f6f9" },
  scrollContent: { padding: 14, paddingBottom: 28 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: rsize(44),
    height: rsize(44),
    borderRadius: rsize(10),
    backgroundColor: "#173B65",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: rsize(18),
    fontWeight: "700",
    color: "#173B65",
  },
  subTitle: {
    fontSize: rsize(12),
    color: "#6b7b8a",
  },

  churchCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  churchName: {
    fontSize: rsize(17),
    fontWeight: "800",
    color: "#173B65",
    marginBottom: 6,
  },

  churchImageSmall: {
    width: rsize(80),
    height: rsize(80),
    borderRadius: 8,
    backgroundColor: "#fff",
  },

  eventImage: {
    width: "100%",
    height: rsize(180),
    borderRadius: 10,
    backgroundColor: "#f7f7f7",
  },

  smallDeleteBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
  },

  input: {
    borderColor: "#e0e6ea",
    borderWidth: 1,
    borderRadius: 10,
    padding: rsize(10),
    marginTop: 10,
    fontSize: rsize(15),
    backgroundColor: "#fff",
  },

  saveBtn: {
    marginTop: 12,
    backgroundColor: "#1F7BC7",
    paddingVertical: rsize(12),
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: rsize(15),
  },

  sectionTitle: {
    fontSize: rsize(15),
    fontWeight: "800",
    color: "#173B65",
    marginTop: 16,
    marginBottom: 8,
  },

  addBtn: {
    backgroundColor: "#2980b9",
    paddingVertical: rsize(10),
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: rsize(14),
  },

  scheduleItem: {
    backgroundColor: "#fff",
    padding: rsize(10),
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  scheduleName: {
    fontWeight: "800",
    fontSize: rsize(15),
    color: "#173B65",
  },
  scheduleTime: {
    fontSize: rsize(13),
    color: "#555",
    marginTop: 4,
  },
  scheduleNotes: {
    fontSize: rsize(13),
    color: "#888",
    marginTop: 6,
  },

  removeBtn: {
    marginTop: 8,
    backgroundColor: "#e74c3c",
    paddingVertical: rsize(10),
    borderRadius: 8,
    alignItems: "center",
  },
  removeBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: rsize(14),
  },

  selectorBox: {
    borderWidth: 1,
    borderColor: "#e0e6ea",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateChip: {
    backgroundColor: "#10a5d8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },

  error: { color: "red", marginTop: 16, textAlign: "center", fontWeight: "700", fontSize: rsize(14) },
  noChurches: { marginTop: 16, color: "#888", fontSize: rsize(14), textAlign: "center", fontStyle: "italic" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalBox: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  modalTitle: {
    fontSize: rsize(16),
    fontWeight: "800",
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  row: { flexDirection: "row", alignItems: "center" },

  typeBadge: {
    fontSize: rsize(12),
    color: "#27ae60",
    marginTop: -6,
    marginBottom: 8,
    fontWeight: "700",
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  picker: {
    fontSize: rsize(15),
    color: '#333',
    flex: 1,
  },

  iconButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerHint: {
    textAlign: 'center',
    color: '#777',
    fontSize: 15,
    marginTop: 6,
  },
  timeNameRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 4,
},
prayerDate: {
    fontSize: rsize(11),
    
  },

  prayerTime: {
    fontSize: rsize(12),
    fontWeight: '700',
  },

  prayerTitle: {
    fontSize: rsize(12),
    fontWeight: '700',
    flexShrink: 1,             // allow long titles to wrap
  },

});
