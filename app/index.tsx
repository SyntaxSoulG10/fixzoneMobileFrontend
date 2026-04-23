import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  // Directly routing you to the login screen so you can see it on app launch! 
  // Later we can restore your 'useAuth' checking logic here.
  return <Redirect href={'/auth/login' as any} />;
}