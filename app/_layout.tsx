import "../global.css";
import "react-native-gesture-handler";
import { useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { AuthProvider, useAuth } from "../context/auth_context";
import { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomDrawer from "../components/navigation/CustomDrawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider } from "../context/UserContext";
import { BookingProvider } from "../context/BookingContext";
import Toast from 'react-native-toast-message';
import { StripeProvider } from '@stripe/stripe-react-native';
import NotificationPoller from '../components/NotificationPoller';
import { StatusBar } from 'expo-status-bar';

const CustomToastCard = ({ text1, text2, type, onPress }: { text1?: string; text2?: string; type: string; onPress?: () => void }) => {
  let iconName: keyof typeof Ionicons.glyphMap = 'notifications';
  let iconColor = '#3B82F6';
  let iconBg = '#EFF6FF';
  let accentColor = '#3B82F6';

  if (type === 'success') {
    iconName = 'checkmark-circle';
    iconColor = '#10B981';
    iconBg = '#ECFDF5';
    accentColor = '#10B981';
  } else if (type === 'warning') {
    iconName = 'alert-circle';
    iconColor = '#F59E0B';
    iconBg = '#FFFBEB';
    accentColor = '#F59E0B';
  } else if (type === 'error') {
    iconName = 'close-circle';
    iconColor = '#EF4444';
    iconBg = '#FEF2F2';
    accentColor = '#EF4444';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[toastStyles.toastContainer, { borderLeftColor: accentColor }]}
    >
      <View style={[toastStyles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      
      <View style={toastStyles.textContainer}>
        {!!text1 && <Text style={toastStyles.titleText} numberOfLines={1}>{text1}</Text>}
        {!!text2 && <Text style={toastStyles.messageText} numberOfLines={2}>{text2}</Text>}
      </View>

      <TouchableOpacity style={toastStyles.closeButton} onPress={() => Toast.hide()}>
        <Ionicons name="close" size={18} color="#94A3B8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const toastConfig = {
  info: (props: any) => <CustomToastCard {...props} type="info" onPress={props.onPress} text1={props.text1} text2={props.text2} />,
  success: (props: any) => <CustomToastCard {...props} type="success" onPress={props.onPress} text1={props.text1} text2={props.text2} />,
  warning: (props: any) => <CustomToastCard {...props} type="warning" onPress={props.onPress} text1={props.text1} text2={props.text2} />,
  error: (props: any) => <CustomToastCard {...props} type="error" onPress={props.onPress} text1={props.text1} text2={props.text2} />,
};

const toastStyles = StyleSheet.create({
  toastContainer: {
    width: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
    marginTop: 8,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 4,
  },
});

function RootLayoutNav() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isVerifyScreen = segments.join('/') === '(auth)/verify-otp';
    const isPasswordResetScreen = 
      segments.join('/') === '(auth)/set-new-password' || 
      segments.join('/') === '(auth)/reset-password';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated) {
      if (!user?.emailVerified && !isVerifyScreen) {
        // Redirect to verification screen if not verified
        router.replace({ pathname: "/(auth)/verify-otp", params: { email: user?.email } });
      } else if (user?.emailVerified && inAuthGroup && !isPasswordResetScreen && !isVerifyScreen) {
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
        <Drawer.Screen name="privacy" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="business-policy" options={{ drawerItemStyle: { display: 'none' } }} />
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
            <StatusBar style="dark" />
            <RootLayoutNav />
            <NotificationPoller />
            <Toast config={toastConfig} />
          </BookingProvider>
        </UserProvider>
      </AuthProvider>
    </StripeProvider>
  );
}