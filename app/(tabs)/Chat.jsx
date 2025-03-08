import { View, Text, StyleSheet, StatusBar, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where } from "firebase/firestore";
import Entypo from '@expo/vector-icons/Entypo';
import { ActivityIndicator } from 'react-native';
import ChatList from '../components/ChatList';
import { useAuth } from '../context/authContext';


export default function Chat() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getUsers = async () => {
    try {
      // Fetch users excluding the current user
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '!=', user.uid));
      const querySnapshot = await getDocs(q);
      
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Fetched Users:", fetchedUsers); // Debug log
      setUsers(fetchedUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getUsers();
    }
  }, [user]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    getUsers();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size='large' color="#5865F2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.titles}>DevTalk</Text>
        <Entypo name="chat" size={29} color="black" style={{ marginRight: 20 }} />
      </View>
      
      {users.length > 0 ? (
  <ChatList users={users} refreshing={loading} onRefresh={handleRefresh} />
) : (
  <View style={styles.noUsersContainer}>
    <Text style={styles.noChats}>No users available</Text>
  </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 20
  },
  titles: {
    fontFamily: 'outfit-bold',
    fontSize: 35,
  },
  noUsersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },
  noChats: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
});