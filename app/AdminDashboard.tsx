
import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { getAdminProfile } from "./utils/getAdminProfile";
import { Picker } from '@react-native-picker/picker';

const API_URL = "http://localhost:3000";

const AdminDashboard = () => {
  // Daily schedule state (for each church)
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleDay, setScheduleDay] = useState("");
  // Generate next 7 days with day name and date
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString(undefined, { weekday: 'long' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString(undefined, { month: 'short' });
    const year = d.getFullYear();
    const display = `${dayName} ${dayNum} ${monthName}`;
    const value = d.toISOString().slice(0, 10); // YYYY-MM-DD
    return { display, value };
  });
  // Helper for time options
  const generateTimeOptions = () => {
    const times = [];
    let hour = 7, minute = 0;
    for (let i = 0; i < 48; i++) {
      const h = ((hour + Math.floor(minute / 60)) % 24);
      const m = minute % 60;
      const ampm = h < 12 ? 'AM' : 'PM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const timeStr = `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
      times.push(timeStr);
      minute += 15;
      if (minute >= 60) {
        hour++;
        minute = minute % 60;
      }
    }
    return times;
  };
  const timeOptions = generateTimeOptions();
  const [assignedChurches, setAssignedChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminName, setAdminName] = useState("");

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
        // Fetch all churches from churchscredentials
        const res = await fetch(`${API_URL}/api/church/ekklesia`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Failed to fetch churches");
          setLoading(false);
          return;
        }
        // Filter churches where admin is in the admins array
        const assigned = (data.churches || []).filter((church: any) =>
          Array.isArray(church.admins) && church.admins.includes(profile.fullName)
        );
        setAssignedChurches(assigned);
      } catch (err) {
        setError("Could not fetch assigned churches");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedChurches();
  }, []);



  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Welcome, {adminName || "Admin"}!</Text>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Churches assigned to you</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#173B65" style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : assignedChurches.length === 0 ? (
          <Text style={styles.noChurches}>No churches assigned to you.</Text>
        ) : (
          assignedChurches.map((church, idx) => (
            <View style={styles.churchCard} key={church._id || idx}>
              <Text style={styles.churchName}>{church.name}</Text>
              <TextInput
                style={styles.input}
                placeholder="Location"
                value={church.location}
                onChangeText={val => {
                  const updated = [...assignedChurches];
                  updated[idx].location = val;
                  setAssignedChurches(updated);
                }}
              />
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="About"
                value={church.about}
                onChangeText={val => {
                  const updated = [...assignedChurches];
                  updated[idx].about = val;
                  setAssignedChurches(updated);
                }}
                multiline
                numberOfLines={5}
              />
               <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  try {
                    const res = await fetch(`${API_URL}/api/church/ekklesia/${church._id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ location: church.location, about: church.about, schedules: church.schedules }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || "Failed to update church info");
                    Alert.alert("Success", "Church info updated!");
                  } catch (err) {
                    Alert.alert("Error", typeof err === "object" && err !== null && "message" in err ? (err as { message?: string }).message || "Could not connect to server" : "Could not connect to server");
                  }
                }}
              >
                <Text style={styles.saveBtnText}>Save Info</Text>
              </TouchableOpacity>
              {/* Daily Schedule Section */}
              <Text style={styles.sectionTitle}>Add Daily Schedule</Text>
              <TextInput
                style={styles.input}
                placeholder="Schedule Name"
                value={scheduleName}
                onChangeText={setScheduleName}
              />
              <View style={{ marginTop: 8, marginBottom: 8 }}>
                <Text style={{ marginBottom: 4, fontWeight: 'bold', color: '#173B65' }}>Day & Date</Text>
                <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
                  <Picker
                    selectedValue={scheduleDay}
                    onValueChange={setScheduleDay}
                    style={{ height: 40 }}
                  >
                    <Picker.Item label="Select day" value="" />
                    {next7Days.map((d, idx) => (
                      <Picker.Item key={idx} label={d.display} value={d.value} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={{ marginTop: 8, marginBottom: 8 }}>
                
                <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
                  <Picker
                    selectedValue={scheduleTime}
                    onValueChange={setScheduleTime}
                    style={{ height: 40 }}
                  >
                    <Picker.Item label="Select time" value="" />
                    {timeOptions.map((t, idx) => (
                      <Picker.Item key={idx} label={t} value={t} />
                    ))}
                  </Picker>
                </View>
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
                  if (!scheduleName || !scheduleTime || !scheduleDay) {
                    Alert.alert("Please enter schedule name, time, and day.");
                    return;
                  }
                  const updated = [...assignedChurches];
                  if (!updated[idx].schedules) updated[idx].schedules = [];
                  updated[idx].schedules.push({ name: scheduleName, time: scheduleTime, date: scheduleDay, notes: scheduleNotes });
                  setAssignedChurches(updated);
                  // Save to backend immediately
                  try {
                    const res = await fetch(`${API_URL}/api/church/ekklesia/${church._id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ schedules: updated[idx].schedules }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || "Failed to update schedule");
                    Alert.alert("Success", "Schedule added!");
                  } catch (err) {
                    Alert.alert("Error", typeof err === "object" && err !== null && "message" in err ? (err as { message?: string }).message || "Could not connect to server" : "Could not connect to server");
                  }
                  setScheduleName("");
                  setScheduleTime("");
                  setScheduleDay("");
                  setScheduleNotes("");
                }}
              >
                <Text style={styles.addBtnText}>Add to Schedule</Text>
              </TouchableOpacity>
              {/* List of schedules */}
              {church.schedules && church.schedules.length > 0 && (
                <View style={{ marginTop: 10, width: '100%' }}>
                  <Text style={styles.sectionTitle}>Current Daily Schedules</Text>
                  <FlatList
                    data={church.schedules}
                    keyExtractor={(_, idx) => idx.toString()}
                    renderItem={({ item, index }) => (
                      <View style={styles.scheduleItem}>
                        <Text style={styles.scheduleName}>{item.name}</Text>
                        <Text style={styles.scheduleTime}>{item.time} - {item.day || item.date}</Text>
                        {item.notes ? <Text style={styles.scheduleNotes}>{item.notes}</Text> : null}
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={async () => {
                            const updated = [...assignedChurches];
                            updated[idx].schedules = updated[idx].schedules.filter((_: any, i: number) => i !== index);
                            setAssignedChurches(updated);
                            try {
                              const res = await fetch(`${API_URL}/api/church/ekklesia/${church._id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ schedules: updated[idx].schedules }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data?.error || "Failed to delete schedule");
                              Alert.alert("Success", "Schedule deleted!");
                            } catch (err) {
                              Alert.alert("Error", typeof err === "object" && err !== null && "message" in err ? (err as { message?: string }).message || "Could not connect to server" : "Could not connect to server");
                            }
                          }}
                        >
                          <Text style={styles.removeBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
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

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#173B65",
    marginTop: 18,
    marginBottom: 6,
  },
  addBtn: {
    backgroundColor: '#2980b9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scheduleItem: {
    backgroundColor: '#f0f4fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  scheduleName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#173B65',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#555',
  },
  scheduleNotes: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: '#1F7BC7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  safe: { flex: 1, backgroundColor: '#f7f9fb' },
  scrollContent: { paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 4 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  // ...existing code...
  error: { color: 'red', marginTop: 16, textAlign: 'center', fontWeight: 'bold', fontSize: 15 },
  noChurches: { marginTop: 16, color: '#888', fontSize: 15, textAlign: 'center', fontStyle: 'italic' },
  container: {},
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#173B65",
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 12,
    textAlign: 'center',
  },
  churchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: '100%',
  },
  churchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#173B65',
    marginBottom: 4,
  },
  churchLocation: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  churchAbout: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  removeBtn: {
    marginTop: 10,
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
