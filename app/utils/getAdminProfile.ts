import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getAdminProfile() {
  const profile = await AsyncStorage.getItem('adminProfile');
  if (!profile) return null;
  try {
    return JSON.parse(profile);
  } catch {
    return null;
  }
}
