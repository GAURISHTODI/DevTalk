import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/authContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import LottieView from "lottie-react-native";


export default function ChatList({ users }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [chatrooms, setChatrooms] = useState({});
  const { user } = useAuth();

  // Fetch chatrooms for the current user
  // In your ChatList.js file, modify the useEffect that fetches chatrooms
useEffect(() => {
  try {
    const chatroomsRef = collection(db, 'chatrooms');
    const q = query(
      chatroomsRef, 
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q, 
      (querySnapshot) => {
        const roomsData = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Determine which user is the other participant
          const otherUserId = data.participants.find(id => id !== user.uid);
          if (otherUserId) {
            roomsData[otherUserId] = {
              lastMessage: data.lastMessage || '',
              lastMessageTimestamp: data.lastMessageTimestamp,
              roomId: doc.id
            };
          }
        });
        setChatrooms(roomsData);
      },
      (error) => {
        console.error("Error fetching chatrooms:", error);
      }
    );

    return () => unsubscribe();
  } catch (err) {
    console.error("Failed to set up chatroom listener:", err);
  }
}, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    if (isToday) {
      return `${formattedHours}:${formattedMinutes}`;
    } else {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return `${day}/${month} ${formattedHours}:${formattedMinutes}`;
    }
  };

  // Truncate long messages for preview
  const truncateMessage = (message, maxLength = 35) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    
    // Remove code blocks for preview
    let cleanMessage = message.replace(/```(\w+)?\n?([\s\S]*?)```/g, '[Code]');
    
    return cleanMessage.substring(0, maxLength) + '...';
  };

  const renderUserItem = ({ item }) => {
    const chatInfo = chatrooms[item.id] || {};
    const lastMessage = chatInfo.lastMessage;
    const lastTimestamp = chatInfo.lastMessageTimestamp;
    
    const formattedTime = lastTimestamp ? formatTimestamp(lastTimestamp) : '';
  
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => router.push({
          pathname: 'components/ChatRoom',
          params: { 
            userTwoId: item.id,
            userTwoName: item.name,
            userTwoEmail: item.email 
          }
        })}
      >
        <View style={styles.userInfoContainer}>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{item.name}</Text>
            {lastMessage && (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {truncateMessage(lastMessage)}
              </Text>
            )}
          </View>
          {formattedTime ? (
            <Text style={styles.timestampText}>
              {formattedTime}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
      <FlatList
  data={users}
  keyExtractor={(item) => item.id.toString()}
  renderItem={renderUserItem}
  contentContainerStyle={styles.listContainer}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl 
      refreshing={refreshing} 
      onRefresh={onRefresh} 
      colors={['#5865F2']} 
    />
  }
  ListFooterComponent={() => (
    <LottieView
      source={require('../../assets/images/generatetrip.json')}
      autoPlay
      loop
      style={{ width: '100%', height: 195 }}
    />
  )}
/>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  listContainer: {
    paddingVertical: 10,
  },
  userItem: {
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    justifyContent: 'space-between',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
});