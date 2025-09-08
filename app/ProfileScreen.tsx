import { View, Text, StyleSheet } from "react-native";

const FindChurchScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Hello World - ProfileScreen</Text>
    </View>
  );
};

export default FindChurchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
