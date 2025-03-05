import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { ToastAndroid } from 'react-native';

export const doCreateUserWithEmailAndPassword = async (email, password, username, phoneNumber, gitHubID) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user?.uid), {
      username,
      phoneNumber,
      gitHubID,
      userId: userCredential.user.uid
    });
    return {sucess: true, data: userCredential?.user}
  } catch (error) {
    let msg = error.message;
    if(msg.includes('(auth/invalid-credential)')) msg="Invalid Mail"
    console.error("Error creating user:", error);
    return {sucess: false, message: error.message}
  }
};

export const doSignInWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential; // Ensure you're returning the entire credential
  } catch (error) {
    console.error("Please create your user profile firstly", error);
    throw error; // This ensures the calling function knows an error occurred
  }
};

export { auth };