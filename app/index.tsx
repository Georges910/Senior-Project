import { SafeAreaView, StyleSheet, StatusBar} from "react-native";
import Login from './login';

export default function Index() {
  return  (<SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="white" />
      <Login />
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
