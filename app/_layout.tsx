import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="login" />
      ) : (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="modal"
            options={{ presentation: 'modal', title: 'Modal' }}
          />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigation />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
