import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";


 const API_URL = "http://localhost:3000"; 


export default function AdminLogin() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [church, setChurch] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
  const res = await fetch(`${API_URL}/api/auth/admin/users`);
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
      } catch (err) {
        // Optionally handle error
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const onLogin = async () => {
    if (!fullName || !church || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
  const res = await fetch(`${API_URL}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, password, church }),
      });
      let data = null;
      let text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        // Not JSON, keep as text
      }
      if (!res.ok) {
        setErrorMsg((data && data.error) || text || "Login failed");
        return;
      }
      // Save JWT token and admin profile for later authentication
      if (data.token) {
        await AsyncStorage.setItem('jwtToken', data.token);
      }
      if (data.admin) {
        await AsyncStorage.setItem('adminProfile', JSON.stringify(data.admin));
      }
      setErrorMsg("");
      router.replace("/AdminDashboard");
    } catch (err) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? (err as Error).message
          : String(err);
      setErrorMsg("Network error: " + errorMessage);
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
          <View style={styles.adminWrap}>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.adminText}>Return To User Login</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.illustrationWrap}>
            <Image
              source={require("../Images/Logo.png")}
              style={{ width: 180, height: 180, resizeMode: "contain" }}
            />
          </View>

          <Text style={styles.appTitle}>Ekklesia</Text>
          <Text style={styles.subtitleText}>Church Admin</Text>
        </View>

        {/* Users List removed as requested */}
        <View style={styles.sheet}>
          <View style={styles.inputRow}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#58617a"
              style={styles.leftIcon}
            />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#96a0b4"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputRow}>
            <Ionicons
              name="home-outline"
              size={18}
              color="#58617a"
              style={styles.leftIcon}
            />
            <TextInput
              placeholder="Church Name"
              placeholderTextColor="#96a0b4"
              value={church}
              onChangeText={setChurch}
              style={styles.input}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputRow}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#58617a"
              style={styles.leftIcon}
            />
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
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={onLogin}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>
          {errorMsg ? (
            <Text style={{ color: 'red', marginTop: 8, textAlign: 'center', fontSize: 13 }}>{errorMsg}</Text>
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
    alignItems: "center",  // keeps logo + title centered
  },

  adminWrap: {
    alignSelf: "flex-start",  // push admin text to the left
  },

  adminText: {
    color: "#c6d3e6",
    fontSize: 12,
    textAlign: "left",
    marginBottom: 6,
  },
  subtitleText: {
    color: "#c6d3e6",
    fontSize: 18,
  },
  illustrationWrap: { alignItems: "center", marginTop: 8 },
  circle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#17365f",
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    marginTop: 10,
    fontSize: 36,
    fontWeight: "800",
    color: "#F4C430",
    letterSpacing: 3,
    marginBottom: 5,
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
