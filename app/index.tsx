import { Redirect } from "expo-router";
import React from "react";
import { useAuth } from "../context/auth_context";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E84E0F" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={'/(tabs)' as any} />;
  } else {
    return <Redirect href={'/(auth)/login' as any} />;
  }
}