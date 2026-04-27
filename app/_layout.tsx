import "../global.css";
import "react-native-gesture-handler";
import { useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { AuthProvider, useAuth } from "../context/auth_context";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import CustomDrawer from "../components/navigation/CustomDrawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BookingProvider } from "../context/BookingContext";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E84E0F" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            width: '80%',
          },
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Home' }} />
        <Drawer.Screen name="(auth)" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="service-center/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}

import { UserProvider } from "../context/UserContext";

export default function Layout() {
  return (
    <UserProvider>
      <BookingProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </BookingProvider>
    </UserProvider>
  );
}