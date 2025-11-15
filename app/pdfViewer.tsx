import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

export default function PdfViewerScreen() {
  const { pdfUrl, title } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#173B65" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title ? String(title) : "PDF Viewer"}</Text>
      </View>

      {/* PDF WebView */}
      <WebView
        source={{ uri: `https://docs.google.com/gview?embedded=true&url=${pdfUrl}` }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    color: "#173B65",
    fontSize: 16,
    marginLeft: 4,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    color: "#173B65",
    marginRight: 40,
  },
  webview: { flex: 1 },
});
