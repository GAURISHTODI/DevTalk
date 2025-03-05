import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Entypo from '@expo/vector-icons/Entypo';

const TabLayout = () => {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: 'lightblue',
      tabBarLabelStyle: { fontSize: 10 },
        tabBarIconStyle: { marginBottom: -5 }, 
        tabBarStyle: { paddingTop: 5, height: 50 }, 
    }}
    >
      <Tabs.Screen name="Chat"
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon:({ color }) => <Entypo name="chat" size={24} color={color} />
        }}
      />

      <Tabs.Screen name="Profile"
      options={{
        tabBarLabel:'Profile',
        tabBarIcon:({ color }) => <Ionicons name='people' size={24} color={color}/>
      }}/>
    </Tabs>
  )
}

export default TabLayout