import "../global.css";
import "react-native-gesture-handler";
import { useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { AuthProvider, useAuth } from "../context/auth_context";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import CustomDrawer from "../components/navigation/CustomDrawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider } from "../context/UserContext";
import { BookingProvider } from "../context/BookingContext";
import Toast, { BaseToast } from 'react-native-toast-message';
import { StripeProvider } from '@stripe/stripe-react-native';
import NotificationPoller from '../components/NotificationPoller';

const toastConfig = {
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#3B82F6', height: 80 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}
      text2Style={{ fontSize: 14, color: '#4B5563' }}
      text2NumberOfLines={2}
    />
  ),
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#10B981', height: 80 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}
      text2Style={{ fontSize: 14, color: '#4B5563' }}
      text2NumberOfLines={2}
    />
  ),
  warning: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#F59E0B', height: 80 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}
      text2Style={{ fontSize: 14, color: '#4B5563' }}
      text2NumberOfLines={2}
    />
  ),
  error: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#EF4444', height: 80 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}
      text2Style={{ fontSize: 14, color: '#4B5563' }}
      text2NumberOfLines={2}
    />
  )
};

function RootLayoutNav() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isVerifyScreen = segments.join('/') === '(auth)/verify-otp';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated) {
      if (!user?.emailVerified && !isVerifyScreen) {
        // Redirect to verification screen if not verified
        router.replace({ pathname: "/(auth)/verify-otp", params: { email: user?.email } });
      } else if (user?.emailVerified && inAuthGroup) {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, user?.emailVerified, segments, isLoading]);

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
        <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Home' }} />
        <Drawer.Screen name="(auth)" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="service-center/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="about" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="support" options={{ drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}

export default function Layout() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
      <AuthProvider>
        <UserProvider>
          <BookingProvider>
            <RootLayoutNav />
            <NotificationPoller />
            <Toast config={toastConfig} />
          </BookingProvider>
        </UserProvider>
      </AuthProvider>
    </StripeProvider>
  );
}