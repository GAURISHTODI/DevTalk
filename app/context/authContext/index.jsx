import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import {auth} from './../../firebase/firebaseConfig'
import { doCreateUserWithEmailAndPassword } from './../../firebase/auth';
import { doSignInWithEmailAndPassword } from './../../firebase/auth';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router= useRouter()
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Store user data in AsyncStorage
  const storeUserData = async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

    } catch (error) {
      console.error('Error storing user data:', error);
    }
  };

  const updateUserData = async (userId) => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let data = docSnap.data();
        setUser({...user, username: data.name, userId: data.userID})
    }
  }

  // Retrieve user data from AsyncStorage
  const getUserData = async() => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData !== null) {
        const parsedUserData = JSON.parse(storedUserData);
        setUser(parsedUserData);
        setIsAuthenticated(true);
        return parsedUserData;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  };

  // Remove user data from AsyncStorage
  const removeUserData = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  };

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.name
        };
        console.log("Here is my user's data", userData )
        await storeUserData(userData);
        updateUserData(userData.uid);
        
      } else {
        await removeUserData();
      }
      setLoading(false);
    });

    // Initial check for stored user data
    getUserData();

    return () => unsubscribe();
  }, []);

  // Login method
  const login = async (email, password) => {
    try {
      const userCredential = await doSignInWithEmailAndPassword(email, password);
  
      if (!userCredential || !userCredential.user) { 
        throw new Error("Authentication failed, userCredential is undefined");
      }
  
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      };

      await storeUserData(userData);
      console.log("We are at least here");
      return userCredential.user;
    } catch (error) {
      console.log("We are here");
      console.error('Login error:', error);
      throw error;
    }
  };
  

  // Logout method
  const logout = async () => {
    try {
      await signOut(auth);
      await removeUserData();
      router.replace('../../Login')
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Register method
  const register = async (email, password, username) => {
    try {
      const user = await doCreateUserWithEmailAndPassword(email, password, username);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        register,
        storeUserData,
        getUserData,
        removeUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;