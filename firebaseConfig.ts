import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwIZVZJ97ZCIHfUr6jrkWEZvOx4Xo9pwg",
  authDomain: "taxis-8433d.firebaseapp.com",
  projectId: "taxis-8433d",
  storageBucket: "taxis-8433d.firebasestorage.app",
  messagingSenderId: "232369140789",
  appId: "1:232369140789:web:51d9bab9354b8436cded7c",
  measurementId: "G-DJYHEDJ7TZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export { GoogleAuthProvider };
