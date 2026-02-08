import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API_URL from '@/app/config/api';

const API_URL_DUPLICATE = "http://192.168.10.249:5000";

export default function AddAdmin() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [church, setChurch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [churches, setChurches] = useState<{ _id?: string; name: string }[]>([]);
  const [newChurchName, setNewChurchName] = useState("");
  const [newChurchLocation, setNewChurchLocation] = useState("");
  const [newChurchAdmins, setNewChurchAdmins] = useState("");
  const [addingChurch, setAddingChurch] = useState(false);
  const [churchSuccessMsg, setChurchSuccessMsg] = useState("");
  const [churchErrorMsg, setChurchErrorMsg] = useState("");
  const [deletingChurchId, setDeletingChurchId] = useState<string | null>(null);
  const [showAllChurches, setShowAllChurches] = useState(false);
  const [editingChurch, setEditingChurch] = useState<{ _id: string; name: string; location?: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [updatingChurch, setUpdatingChurch] = useState(false);

  useEffect(() => {
    const fetchChurches = async () => {
      try {
        console.log('[MainAdmins] Fetching churches from:', `${API_URL}/api/church/churches`);
        const res = await fetch(`${API_URL}/api/church/churches`);
        const data = await res.json();
        console.log('[MainAdmins] Churches response:', data);
        
        if (res.ok && data.churches) {
          console.log('[MainAdmins] Loaded churches:', data.churches.length);
          setChurches(data.churches);
        } else {
          console.log('[MainAdmins] Failed to load churches:', data.error);
          setChurchErrorMsg(data.error || "Failed to load churches");
        }
      } catch (err) {
        console.error('[MainAdmins] Error fetching churches:', err);
        setChurchErrorMsg("Could not connect to server to fetch churches");
      }
    };
    fetchChurches();
  }, []);

  const onAddChurch = async () => {
    if (!newChurchName.trim()) {
      setChurchErrorMsg("Please enter a church name.");
      return;
    }
    setAddingChurch(true);
    setChurchErrorMsg("");
    setChurchSuccessMsg("");
    try {
      const adminsArray = newChurchAdmins.trim()
        ? newChurchAdmins.split(",").map((id) => id.trim())
        : [];
      const res = await fetch(`${API_URL}/api/church/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newChurchName,
          location: newChurchLocation,
          admins: adminsArray,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChurchErrorMsg(data?.error || "Failed to add church");
        setChurchSuccessMsg("");
        return;
      }
      setChurchSuccessMsg("Church was added");
      setChurchErrorMsg("");
      setNewChurchName("");
      setNewChurchLocation("");
      setNewChurchAdmins("");
      
      // Refresh church list from server to ensure consistency
      console.log('[MainAdmins] Refreshing church list after add');
      try {
        const refreshRes = await fetch(`${API_URL}/api/church/churches`);
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.churches) {
          console.log('[MainAdmins] Church list refreshed:', refreshData.churches.length);
          setChurches(refreshData.churches);
        }
      } catch (refreshErr) {
        console.log('[MainAdmins] Could not refresh church list, using local update');
        // Fallback: add to local state
        setChurches((prev) => [...prev, { name: data.church?.name || newChurchName }]);
      }
    } catch (err) {
      setChurchErrorMsg("Could not connect to server");
    } finally {
      setAddingChurch(false);
    }
  };

  const onAddAdmin = async () => {
    if (!fullName || !password || !church) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/api/auth/add-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, password, church }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || "Failed to add admin");
        setSuccessMsg("");
        return;
      }
      setSuccessMsg("Admin was added");
      setErrorMsg("");
      setFullName("");
      setPassword("");
      setChurch("");
    } catch (err) {
      setErrorMsg("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteChurch = async (churchId: string, churchName: string) => {
    if (!churchId) {
      setChurchErrorMsg("Cannot delete church: missing ID");
      return;
    }
    
    // For web platform, use window.confirm; for native, use Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete "${churchName}"?`);
      if (!confirmed) return;
      
      await performDelete(churchId, churchName);
    } else {
      Alert.alert(
        "Delete Church",
        `Are you sure you want to delete "${churchName}"?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => performDelete(churchId, churchName)
          }
        ]
      );
    }
  };

  const performDelete = async (churchId: string, churchName: string) => {
    setDeletingChurchId(churchId);
    setChurchErrorMsg("");
    setChurchSuccessMsg("");
    
    try {
      console.log('[MainAdmins] Deleting church with ID:', churchId);
      const res = await fetch(`${API_URL}/api/church/${churchId}`, {
        method: "DELETE",
      });
      
      console.log('[MainAdmins] Delete response status:', res.status);
      const data = await res.json();
      console.log('[MainAdmins] Delete response data:', data);
      
      if (!res.ok) {
        setChurchErrorMsg(data?.error || "Failed to delete church");
        setDeletingChurchId(null);
        return;
      }
      
      setChurchSuccessMsg(`Church "${churchName}" was deleted`);
      // Remove from local state
      setChurches((prev) => prev.filter((c) => c._id !== churchId));
    } catch (err) {
      console.error('[MainAdmins] Error deleting church:', err);
      setChurchErrorMsg("Could not connect to server");
    } finally {
      setDeletingChurchId(null);
    }
  };

  const onEditChurch = (church: { _id?: string; name: string; location?: string }) => {
    if (!church._id) return;
    setEditingChurch({ _id: church._id, name: church.name, location: church.location });
    setEditName(church.name);
    setEditLocation(church.location || "");
    setChurchErrorMsg("");
    setChurchSuccessMsg("");
  };

  const onUpdateChurch = async () => {
    if (!editingChurch || !editName.trim()) {
      setChurchErrorMsg("Church name is required");
      return;
    }

    setUpdatingChurch(true);
    setChurchErrorMsg("");
    setChurchSuccessMsg("");

    try {
      console.log('[MainAdmins] Updating church:', editingChurch._id);
      const res = await fetch(`${API_URL}/api/church/update/${editingChurch._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          location: editLocation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setChurchErrorMsg(data?.error || "Failed to update church");
        setUpdatingChurch(false);
        return;
      }

      setChurchSuccessMsg(`Church "${editName}" was updated`);
      // Update local state
      setChurches((prev) =>
        prev.map((c) =>
          c._id === editingChurch._id
            ? { ...c, name: editName, location: editLocation }
            : c
        )
      );
      // Clear edit state
      setEditingChurch(null);
      setEditName("");
      setEditLocation("");
    } catch (err) {
      console.error('[MainAdmins] Error updating church:', err);
      setChurchErrorMsg("Could not connect to server");
    } finally {
      setUpdatingChurch(false);
    }
  };

  const onCancelEdit = () => {
    setEditingChurch(null);
    setEditName("");
    setEditLocation("");
    setChurchErrorMsg("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#0b2b52" }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
  <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/adminlogin")}>
    <Text style={styles.backText}>Back</Text>
  </TouchableOpacity>
  <Text style={styles.appTitle}>Add Admin</Text>
</View>


        <View style={styles.sheet}>
          {/* Add Church Section */}
          <Text style={styles.sectionTitle}>Add a Church</Text>
          <View style={styles.inputRow}>
            <Ionicons name="home-outline" size={18} color="#58617a" style={styles.leftIcon} />
            <TextInput
              placeholder="Church Name"
              placeholderTextColor="#96a0b4"
              value={newChurchName}
              onChangeText={setNewChurchName}
              style={styles.input}
            />
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={18} color="#58617a" style={styles.leftIcon} />
            <TextInput
              placeholder="Location (optional)"
              placeholderTextColor="#96a0b4"
              value={newChurchLocation}
              onChangeText={setNewChurchLocation}
              style={styles.input}
            />
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="people-outline" size={18} color="#58617a" style={styles.leftIcon} />
            <TextInput
              placeholder="Admin IDs (comma-separated, optional)"
              placeholderTextColor="#96a0b4"
              value={newChurchAdmins}
              onChangeText={setNewChurchAdmins}
              style={styles.input}
            />
          </View>
          <TouchableOpacity
            style={[styles.loginBtn, addingChurch && { opacity: 0.7 }]}
            onPress={onAddChurch}
            disabled={addingChurch}
          >
            <Text style={styles.loginText}>{addingChurch ? "Adding..." : "Add Church"}</Text>
          </TouchableOpacity>
          {churchSuccessMsg ? <Text style={styles.successText}>{churchSuccessMsg}</Text> : null}
          {churchErrorMsg ? <Text style={styles.errorText}>{churchErrorMsg}</Text> : null}

          {/* Display All Churches */}
          {churches.length > 0 && (
            <View style={styles.churchListContainer}>
              <View style={styles.churchListHeader}>
                <Text style={styles.churchListTitle}>All Churches ({churches.length})</Text>
                {churches.length > 5 && (
                  <TouchableOpacity onPress={() => setShowAllChurches(!showAllChurches)}>
                    <Text style={styles.showAllButton}>
                      {showAllChurches ? 'Show Less' : 'Show All'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Edit Form - Shows when editing a church */}
              {editingChurch && (
                <View style={styles.editFormContainer}>
                  <Text style={styles.editFormTitle}>Edit Church</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="home-outline" size={18} color="#58617a" style={styles.leftIcon} />
                    <TextInput
                      placeholder="Church Name"
                      placeholderTextColor="#96a0b4"
                      value={editName}
                      onChangeText={setEditName}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Ionicons name="location-outline" size={18} color="#58617a" style={styles.leftIcon} />
                    <TextInput
                      placeholder="Location (optional)"
                      placeholderTextColor="#96a0b4"
                      value={editLocation}
                      onChangeText={setEditLocation}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.editFormButtons}>
                    <TouchableOpacity
                      style={[styles.cancelBtn]}
                      onPress={onCancelEdit}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.updateBtn, updatingChurch && { opacity: 0.7 }]}
                      onPress={onUpdateChurch}
                      disabled={updatingChurch}
                    >
                      <Text style={styles.updateBtnText}>
                        {updatingChurch ? "Updating..." : "Update"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {(showAllChurches ? churches : churches.slice(0, 3))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((church, index) => (
                <View key={church._id || index} style={styles.churchItem}>
                  <View style={styles.churchInfo}>
                    <Ionicons name="home" size={18} color="#173B65" />
                    <Text style={styles.churchName}>{church.name}</Text>
                  </View>
                  <View style={styles.churchActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => onEditChurch(church)}
                      disabled={!church._id}
                    >
                      <Ionicons name="pencil-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.deleteBtn,
                        deletingChurchId === church._id && { opacity: 0.5 }
                      ]}
                      onPress={() => onDeleteChurch(church._id!, church.name)}
                      disabled={deletingChurchId === church._id || !church._id}
                    >
                      {deletingChurchId === church._id ? (
                        <Text style={styles.deleteBtnText}>Deleting...</Text>
                      ) : (
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {!showAllChurches && churches.length > 3 && (
                <Text style={styles.hiddenChurchesText}>
                  +{churches.length - 3} more church{churches.length - 3 !== 1 ? 'es' : ''}
                </Text>
              )}
            </View>
          )}

          {/* Add Admin Section */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Add an Admin</Text>
          
          {/* Admin Info */}
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#58617a" style={styles.leftIcon} />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#96a0b4"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#58617a" style={styles.leftIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#96a0b4"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#58617a"
              />
            </TouchableOpacity>
          </View>

          {/* Church Picker */}
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="church" size={18} color="#58617a" style={styles.leftIcon} />
            <Picker
              selectedValue={church}
              onValueChange={(itemValue) => {
                console.log('[MainAdmins] Church selected:', itemValue);
                setChurch(itemValue);
              }}
              style={{
                flex: 1,
                color: church ? "#222" : "#96a0b4",
              }}
            >
              <Picker.Item label="Select Church" value="" color="#96a0b4" />
              {churches.length > 0 ? (
                churches
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c, index) => (
                  <Picker.Item key={c.name || index} label={c.name} value={c.name} />
                ))
              ) : (
                <Picker.Item label="No churches available" value="" enabled={false} />
              )}
            </Picker>
          </View>
          {churches.length === 0 && (
            <Text style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4, marginLeft: 36 }}>
              No churches loaded. Please add a church first or check server connection.
            </Text>
          )}
          {churches.length > 0 && (
            <Text style={{ fontSize: 12, color: '#27ae60', marginTop: 4, marginLeft: 36 }}>
              {churches.length} church{churches.length !== 1 ? 'es' : ''} available
            </Text>
          )}

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={onAddAdmin}
            disabled={loading}
          >
            <Text style={styles.loginText}>{loading ? "Adding..." : "Add Admin"}</Text>
          </TouchableOpacity>

          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
  paddingTop: 28,
  paddingHorizontal: 22,
  backgroundColor: "#0b2b52",
  alignItems: "center",
  position: "relative", // important for absolute back button
},
backButton: {
  position: "absolute",
  left: 22,
  top: 28,
  zIndex: 10,
},
backText: {
  color: "#c6d3e6",
  fontSize: 16,
  fontWeight: "bold",
},
  appTitle: { marginTop: 10, fontSize: 36, fontWeight: "800", color: "#F4C430", marginBottom: 20 },
  sheet: { flexGrow: 1, backgroundColor: "#fff", marginTop: 16, borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingTop: 18, paddingBottom: 34, alignItems: "center" },
  inputRow: { width: "86%", flexDirection: "row", alignItems: "center", borderColor: "#4b5a79", borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 28, marginTop: 12, backgroundColor: "#fff" },
  leftIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#222" },
  loginBtn: { width: "86%", marginTop: 18, backgroundColor: "#173B65", paddingVertical: 14, borderRadius: 24, alignItems: "center", borderWidth: 2, borderColor: "#e7ecf6" },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sectionTitle: { color: "#173B65", fontWeight: "bold", fontSize: 18, marginBottom: 8 },
  successText: { color: "green", marginTop: 8, textAlign: "center", fontSize: 13 },
  errorText: { color: "red", marginTop: 8, textAlign: "center", fontSize: 13 },
  churchListContainer: {
    width: "86%",
    marginTop: 20,
    marginBottom: 10,
  },
  churchListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  churchListTitle: {
    color: "#173B65",
    fontWeight: "bold",
    fontSize: 16,
  },
  showAllButton: {
    color: "#173B65",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  hiddenChurchesText: {
    fontSize: 13,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  churchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  churchInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  churchName: {
    fontSize: 15,
    color: "#222",
    marginLeft: 10,
    fontWeight: "500",
  },
  deleteBtn: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  churchActions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  editFormContainer: {
    backgroundColor: "#e8f4f8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#3498db",
  },
  editFormTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#173B65",
    marginBottom: 12,
  },
  editFormButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#95a5a6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  updateBtn: {
    flex: 1,
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  updateBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
