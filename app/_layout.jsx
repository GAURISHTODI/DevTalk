import { Stack } from "expo-router";
import {useFonts}  from "expo-font"
import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { AuthProvider } from "./context/authContext";

export default function RootLayout() {

  const [fontsLoaded] = useFonts({
    "outfit": require("./../assets/fonts/Outfit-Regular.ttf"),
    "outfit-bold": require("./../assets/fonts/Outfit-Bold.ttf"),
    "outfit-medium": require("./../assets/fonts/Outfit-Medium.ttf"),
  });

  const [userData, setUserData] = useState([])
  
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{headerShown:false}}>
      <Stack.Screen name="index" />
      <Stack.Screen name ="(tabs)"/>
    </Stack>
    </AuthProvider>
    
  );
}
