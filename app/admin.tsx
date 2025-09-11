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
import { useRouter } from "expo-router";

const API_URL = "http://localhost:3000";


export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
    if (!email || !password) {
      setErrorMsg("Please fill in both fields.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      // Replace with your admin login endpoint if different
      const res = await fetch(`${API_URL}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Login failed");
        return;
      }
      Alert.alert("Success", "Admin login successful");
      setErrorMsg("");
      //router.replace("/admin-dashboard"); // Change to your admin dashboard route
    } catch (err) {
      setErrorMsg("Could not connect to server");
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
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-start' }}>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.adminText}>Login</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.illustrationWrap}>
            <View style={styles.circle}>
              <Image
                source={{
                  uri: "https://raw.githubusercontent.com/midwire/assets/main/church-flat.png",
                }}
                style={{ width: 140, height: 140, resizeMode: "contain" }}
              />
            </View>
          </View>
          <Text style={styles.appTitle}>Ekklesia Admin</Text>
        </View>

  {/* Users List removed as requested */}
        <View style={styles.sheet}>
          <TouchableOpacity
            style={[styles.loginBtn, { marginBottom: 10, backgroundColor: '#F4C430' }]}
            onPress={() => router.push('/mainadmins')}
          >
            <Text style={[styles.loginText, { color: '#0b2b52' }]}>Add Admin</Text>
          </TouchableOpacity>
          <View style={styles.inputRow}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#58617a"
              style={styles.leftIcon}
            />
            <TextInput
              placeholder="Admin Email"
              placeholderTextColor="#96a0b4"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
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
    alignItems: "center",
  },
  adminText: {
    color: "#c6d3e6",
    fontSize: 16,
    alignSelf: "flex-start",
    marginBottom: 6,
    fontWeight: 'bold',
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
    letterSpacing: 0.3,
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
