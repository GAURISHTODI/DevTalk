import React from 'react';
import { 
  View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, SafeAreaView 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/authContext';
import { useNavigation } from '@react-navigation/native';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    console.log("Logging out...");
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titles}>Profile</Text>
        <Ionicons name="person" size={29} color="black" style={{ marginRight: 10 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Details */}
        <View style={styles.profileCard}>
          <Text style={styles.heading}>Profile Information</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{user?.name || 'N/A'}</Text>

            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email || 'N/A'}</Text>

            <Text style={styles.label}>GitHub ID:</Text>
            <Text style={styles.value}>{user?.gitHub || 'N/A'}</Text>

            <Text style={styles.label}>Phone Number:</Text>
            <Text style={styles.value}>{user?.phoneNumber || 'N/A'}</Text>
          </View>

          

          <TouchableOpacity
          style={[styles.buttonStyle, { backgroundColor: '#5865F2' }]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.buttonStyle, { backgroundColor: '#5865F2' }]} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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

  profileCard: {
    alignItems: 'center',
    marginTop: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily:'outfit-bold'
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
    fontFamily:'outfit-bold'
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
    fontFamily:'outfit-medium'
  },
  buttonStyle: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily:'outfit-medium'
  },
});

