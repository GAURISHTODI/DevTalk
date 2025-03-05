import React from "react";
import { View, ActivityIndicator } from "react-native";
import Login from "./Login";
import { useAuth } from "./context/authContext";
import { Redirect } from "expo-router";

export default function Index() {
  const { user, loading } = useAuth();

  // If still loading, show loading indicator
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="lightblue" />
      </View>
    );
  }

  // If user is logged in, redirect to chat
  if (user) {
    return <Redirect href="/Chat" />;
  }

  // Show login screen if not logged in
  return (
    <View style={{ flex: 1 }}>
      <Login />
    </View>
  );
}