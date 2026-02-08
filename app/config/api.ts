/**
 * API Configuration - Dynamic Backend URL
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PORT = '3001';
const DEFAULT_IP = '192.168.10.249';

export const API_CONFIG = {
  DEFAULT_API_URL: `http://${DEFAULT_IP}:${DEFAULT_PORT}`,
  STORAGE_KEY: 'ekklesia_api_url',
};

// Export for synchronous usage (uses default URL)
export const API_URL = API_CONFIG.DEFAULT_API_URL;

// Get API URL - checks AsyncStorage first, falls back to default
export async function getApiUrl(): Promise<string> {
  try {
    const savedUrl = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEY);
    return savedUrl || API_CONFIG.DEFAULT_API_URL;
  } catch (error) {
    console.warn('Could not retrieve API URL from storage:', error);
    return API_CONFIG.DEFAULT_API_URL;
  }
}

// Set API URL to AsyncStorage
export async function setApiUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(API_CONFIG.STORAGE_KEY, url);
    console.log('API URL saved:', url);
  } catch (error) {
    console.error('Failed to save API URL:', error);
  }
}
