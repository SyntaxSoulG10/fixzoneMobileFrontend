import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  // We now handle auth logic in _layout.tsx. 
  // This index.tsx serves as the entry point and will default to the tabs group.
  return <Redirect href={'/(tabs)' as any} />;
}