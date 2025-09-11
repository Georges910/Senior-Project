import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const API_URL = "http://localhost:3000"; // Change to your server IP if needed

export default function AddAdmin() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [church, setChurch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setErrorMsg("Server did not return valid JSON");
        console.error("JSON parse error:", jsonErr);
        return;
      }
      if (!res.ok) {
        if (data?.error === "Admin already exists for this church") {
          setErrorMsg("An admin with this name already exists for this church.");
        } else {
          setErrorMsg(data?.error || "Failed to add admin");
        }
        setSuccessMsg("");
        console.error("API error:", data);
        return;
      }
      setSuccessMsg("Admin was added");
      setErrorMsg("");
      setFullName("");
      setPassword("");
      setChurch("");
    } catch (err) {
      setErrorMsg("Could not connect to server");
      console.error("Network error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#0b2b52" }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <View style={{ width: "100%", flexDirection: "row", justifyContent: "flex-start" }}>
            <TouchableOpacity onPress={() => router.replace("/admin")}> 
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.appTitle}>Add Admin</Text>
        </View>

        <View style={styles.sheet}>
          {/* Full Name */}
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



          {/* Password */}
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

          {/* Church */}
          <View style={styles.inputRow}>
            <Ionicons name="home-outline" size={18} color="#58617a" style={styles.leftIcon} />
            <TextInput
              placeholder="Church Name"
              placeholderTextColor="#96a0b4"
              value={church}
              onChangeText={setChurch}
              style={styles.input}
            />
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={onAddAdmin}
            disabled={loading}
          >
            <Text style={styles.loginText}>{loading ? "Adding..." : "Add Admin"}</Text>
          </TouchableOpacity>

          {successMsg ? (
            <Text style={{ color: "red", marginTop: 8, textAlign: "center", fontSize: 13 }}>
              {successMsg}
            </Text>
          ) : null}
          {errorMsg ? (
            <Text style={{ color: "red", marginTop: 8, textAlign: "center", fontSize: 13 }}>
              {errorMsg}
            </Text>
          ) : null}
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
  },
  backText: {
    color: "#c6d3e6",
    fontSize: 16,
    marginBottom: 6,
    fontWeight: "bold",
  },
  appTitle: {
    marginTop: 10,
    fontSize: 36,
    fontWeight: "800",
    color: "#F4C430",
    marginBottom: 20,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: "#fff",
    marginTop: 16,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 18,
    paddingBottom: 34,
    alignItems: "center",
  },
  inputRow: {
    width: "86%",
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#4b5a79",
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 28,
    marginTop: 12,
    backgroundColor: "#fff",
  },
  leftIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#222" },
  loginBtn: {
    width: "86%",
    marginTop: 18,
    backgroundColor: "#0b2b52",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e7ecf6",
  },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
