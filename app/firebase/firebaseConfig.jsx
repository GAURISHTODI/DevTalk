import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAmxjl3YCmQzA0BbXYeRysOF-JtsNFFhCY",
  authDomain: "devtalk-956ac.firebaseapp.com",
  projectId: "devtalk-956ac",
  storageBucket: "devtalk-956ac.firebasestorage.app",
  messagingSenderId: "73558770135",
  appId: "1:73558770135:web:8bcd884aa3a482405a0b92"
};

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with persistent storage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export const usersRef = collection(db, 'users');
export const roomRef = collection(db, 'rooms'); 

export { app, auth, db };