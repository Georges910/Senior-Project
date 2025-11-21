import React, { useState } from "react";
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
import AsyncStorage from '@react-native-async-storage/async-storage';

//const API_URL = "http://10.24.113.128:3000"
const API_URL = "http://localhost:3000"; 

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async () => {
    console.log("Login button pressed");

    if (!email || !password) {
      Alert.alert("Validation", "Please fill in both fields.");
      return;
    }
    setLoading(true);

    try {
      setErrorMsg("");
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password }),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response body:", data);

      if (!res.ok) {
        setErrorMsg(data.error || "Login failed");
        return;
      }

      // Save JWT token
      if (data.token) {
        await AsyncStorage.setItem("jwtToken", data.token);
      }

      // Fetch user profile after successful login with token
      let profile: any = {};
      if (data.token) {
        const profileRes = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        profile = await profileRes.json();
        if (profile.fullName && profile.parish && profile.email) {
          await AsyncStorage.setItem(
            "userProfile",
            JSON.stringify({
              fullName: profile.fullName,
              parish: profile.parish,
              email: profile.email,
            })
          );
        }
      }

      Alert.alert("Success", "Login successful");
      setErrorMsg("");
      router.replace("/home");
    } catch (err) {
      console.error("Login error:", err);
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.adminWrap}>
            <TouchableOpacity onPress={() => router.push("/adminlogin")}>
              <Text style={styles.adminText}>Are You Church Admin?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.illustrationWrap}>
            <Image
              source={require("../Images/Logo.png")}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.appTitle}>Ekklesia</Text>
        </View>

        {/* White sheet */}
        <View style={styles.sheet}>
          {/* Email */}
          <View style={styles.inputRow}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#58617a"
              style={styles.leftIcon}
            />
            <TextInput
              placeholder="Email or Phone"
              placeholderTextColor="#96a0b4"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
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

          {/* Forgot password */}
          <TouchableOpacity style={{ alignSelf: "center", marginTop: 10 }} onPress={() => router.push('/forgepassword')}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={onLogin}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          {/* Error message */}
          {errorMsg ? (
            <Text
              style={{
                color: "red",
                marginTop: 8,
                textAlign: "center",
                fontSize: 13,
              }}
            >
              {errorMsg}
            </Text>
          ) : null}

          <Text style={styles.or}>or</Text>

          {/* Create account */}
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.createText}>Create an account</Text>
          </TouchableOpacity>
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
    alignItems: "center", // keeps logo + title centered
  },
  adminWrap: {
    alignSelf: "flex-start", // push admin text to the left
  },
  adminText: {
    color: "#c6d3e6",
    fontSize: 12,
    textAlign: "left",
    marginBottom: 6,
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
  forgot: { fontSize: 12, color: "#6d7486" },
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
  or: { marginTop: 14, color: "#9aa1b6" },
  createBtn: {
    width: "86%",
    marginTop: 10,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1.4,
    borderColor: "#4b5a79",
  },
  createText: { color: "#0b2b52", fontWeight: "700", fontSize: 16 },
});

