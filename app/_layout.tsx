import { Stack } from 'expo-router';
import { ThemeProvider } from './context/ThemeContext';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar barStyle="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="home" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="church" />
        <Stack.Screen name="BooksScreen" />
        <Stack.Screen name="Recommendations" />
        <Stack.Screen name="FindChurchScreen" />
        <Stack.Screen name="pdfViewer" />
        <Stack.Screen name="forgepassword" />
        <Stack.Screen name="adminlogin" />
        <Stack.Screen name="AdminDashboard" />
        <Stack.Screen name="mainadmins" />
      </Stack>
    </ThemeProvider>
  );
}
