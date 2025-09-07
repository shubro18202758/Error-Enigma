// Firebase configuration for frontend
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAz_oD7ZTzoJqsJOc3wWOtzJZ94luR3si4",
  authDomain: "error-404-6b343.firebaseapp.com",
  projectId: "error-404-6b343",
  storageBucket: "error-404-6b343.appspot.com",
  messagingSenderId: "1090942717056",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1090942717056:web:default"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
