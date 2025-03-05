import { View, Text, StyleSheet,StatusBar , TouchableOpacity, ScrollView} from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/authContext';

export default function Profile() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    console.log("Pressout logout")
    await logout();
    
  }
  return (
    <View style={styles.container}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}>
        <Text style={styles.titles}>Profile</Text>
        <Ionicons name="person" size={29} color="black" style={{marginRight: 10}} />
        
  
    </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
                            style={[styles.buttonStyle, { backgroundColor: 'lightblue' }]}
                            onPress={handleLogout}
                        >
                            <Text style={styles.buttonText}> Logout</Text>
                        </TouchableOpacity>
        </ScrollView>
    </View>
  );
};

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
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: 200,
  },
  textContainer: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  flag: {
    width: 30,
    height: 20,
    marginLeft: 10,
  },
  buttonStyle: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'black',
},
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'outfit-bold',
},
});
