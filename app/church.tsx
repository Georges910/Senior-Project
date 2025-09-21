import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

const ChurchScreen = () => {
  // Get params from navigation
  const { id, name, location, about } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name || "Church Details"}</Text>
      <Text style={styles.label}>Location:</Text>
      <Text style={styles.value}>{location}</Text>
      <Text style={styles.label}>About:</Text>
      <Text style={styles.value}>{about}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#173B65",
  },
  label: {
    fontWeight: "bold",
    marginTop: 12,
    color: "#173B65",
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
});

export default ChurchScreen;
