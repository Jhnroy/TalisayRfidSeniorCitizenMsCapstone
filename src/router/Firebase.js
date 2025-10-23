// Firebase.js
// Import Firebase SDKs
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // ✅ Realtime Database

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAO9TdAUkHNh7jk9U6NRKlCtMmM0pla-_0",
  authDomain: "rfidbasedseniormscapstone.firebaseapp.com",
  databaseURL: "https://rfidbasedseniormscapstone-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfidbasedseniormscapstone",
  storageBucket: "rfidbasedseniormscapstone.firebasestorage.app",
  messagingSenderId: "231424248323",
  appId: "1:231424248323:web:a609ea6237275d93eb9c36",
  measurementId: "G-NCE2MRD0WL",
};

// Initialize Firebase only if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export default app;
