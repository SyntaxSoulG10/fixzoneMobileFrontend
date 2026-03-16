import { View, Text } from 'react-native'
import React from 'react'


const Index = () => {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-2xl font-bold text-blue-600">
        Hello Tailwind 👋
      </Text>
    </View>
  )
}

export default Index

/*import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If logged in → go to home
  if (user) {
    return <Redirect href="/home" />;
  }

  // If not logged in → go to login
  return <Redirect href="/auth/login" />;
}*/