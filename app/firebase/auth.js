import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { ToastAndroid } from 'react-native';

export const doSignInWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential; // Return user credential if login is successful
  } catch (error) {
    // Display a toast message instead of logging the error
    if (error.code === 'auth/invalid-credential') {
      ToastAndroid.show("These credentials are invalid. Please try again.", ToastAndroid.SHORT);
    } else {
      ToastAndroid.show("An error occurred. Please try again later.", ToastAndroid.SHORT);
    }

    // Remove console.error to prevent logging in the console
    // console.error("Login Error:", error); 

    throw error; // Here I am still throwing error 
  }
};


export const doCreateUserWithEmailAndPassword = async (email, password, name, phoneNumber, gitHub) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user?.uid), {
      name,
      phoneNumber,
      gitHub,
      userId: userCredential.user.uid
    });

    ToastAndroid.show("Account Created Successfully", ToastAndroid.BOTTOM); 
    return {
      sucess: true,
      data: userCredential?.user
      
    }
  } catch (error) {
    let msg = error.message;
    if(msg.includes('(auth/invalid-credential)')) msg="Invalid Mail"
    // console.error("Error creating user:", error);
     ToastAndroid.show("Email already in use", ToastAndroid.BOTTOM);
    return {sucess: false, message: error.message}
  }
};





export { auth };