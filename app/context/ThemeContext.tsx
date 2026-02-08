import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: typeof lightColors;
}

// Light theme colors
export const lightColors = {
  // Primary brand colors
  primary: '#173B65',
  primaryDark: '#0b2b52',
  primaryLight: '#1F7BC7',
  accent: '#F4C430',
  
  // Backgrounds
  background: '#ffffff',
  backgroundSecondary: '#f7f9fb',
  backgroundTertiary: '#f5f5f5',
  card: '#ffffff',
  
  // Text colors
  text: '#222222',
  textSecondary: '#555555',
  textTertiary: '#666666',
  textMuted: '#999999',
  textInverse: '#ffffff',
  
  // Borders & inputs
  border: '#4b5a79',
  borderLight: '#e7ecf6',
  inputBackground: '#ffffff',
  inputBorder: '#4b5a79',
  placeholder: '#96a0b4',
  
  // Status colors
  success: '#27ae60',
  error: '#e74c3c',
  errorLight: '#ff6b6b',
  errorBg: '#ffecec',
  errorText: '#9b2c2c',
  info: '#3498db',
  infoBg: '#eef6ff',
  warning: '#f39c12',
  
  // Icons & misc
  icon: '#58617a',
  iconActive: '#F4C430',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Dark theme colors
export const darkColors = {
  // Primary brand colors
  primary: '#1F7BC7',
  primaryDark: '#173B65',
  primaryLight: '#3a9adb',
  accent: '#F4C430',
  
  // Backgrounds
  background: '#0d1117',
  backgroundSecondary: '#161b22',
  backgroundTertiary: '#21262d',
  card: '#161b22',
  
  // Text colors
  text: '#e6edf3',
  textSecondary: '#c9d1d9',
  textTertiary: '#8b949e',
  textMuted: '#6e7681',
  textInverse: '#0d1117',
  
  // Borders & inputs
  border: '#30363d',
  borderLight: '#21262d',
  inputBackground: '#0d1117',
  inputBorder: '#30363d',
  placeholder: '#6e7681',
  
  // Status colors
  success: '#2ea043',
  error: '#f85149',
  errorLight: '#ff6b6b',
  errorBg: '#3b1219',
  errorText: '#ffa198',
  info: '#58a6ff',
  infoBg: '#1c2d41',
  warning: '#d29922',
  
  // Icons & misc
  icon: '#8b949e',
  iconActive: '#F4C430',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'ekklesia_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() || 'light'
  );

  // Load saved theme mode from storage
  useEffect(() => {
    loadThemeMode();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme || 'light');
    });

    return () => subscription.remove();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  // Determine actual theme based on mode
  const actualTheme: 'light' | 'dark' = 
    themeMode === 'auto' ? systemTheme : themeMode;

  const colors = actualTheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme: actualTheme, themeMode, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
