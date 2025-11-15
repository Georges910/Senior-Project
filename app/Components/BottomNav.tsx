import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BottomNav = ({ active }: { active: string }) => {
  const router = useRouter();

  const buttons = [
  { name: "Home", icon: "home-outline", route: "/home" },
  { name: "Find Church", icon: "location-outline", route: "/FindChurchScreen" },
  { name: "Books", icon: "book-outline", route: "/BooksScreen" },
] as const; 

  return (
    <View style={styles.container}>
      {buttons.map((b) => (
        <TouchableOpacity
          key={b.name}
          onPress={() => router.push(b.route as any)}
          style={[styles.button, active === b.name && styles.activeButton]}
        >
          <Ionicons
            name={b.icon as any}
            size={24}
            color={active === b.name ? "#fff" : "#173B65"}
          />
          <Text style={[styles.label, active === b.name && styles.activeLabel]}>
            {b.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    width: "70%",
    borderRadius: 40,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  button: { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 30 },
  activeButton: {
    backgroundColor: "#173B65",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#173B65",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  label: { fontSize: 11, fontWeight: "600", color: "#173B65", marginTop: 2 },
  activeLabel: { color: "#fff" },
});
