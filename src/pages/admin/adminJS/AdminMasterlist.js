// Firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAO9TdAUkHNh7jk9U6NRKlCtMmM0pla-_0",
  authDomain: "rfidbasedseniormscapstone.firebaseapp.com",
  databaseURL: "https://rfidbasedseniormscapstone-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfidbasedseniormscapstone",
  storageBucket: "rfidbasedseniormscapstone.firebasestorage.app",
  messagingSenderId: "231424248323",
  appId: "1:231424248323:web:a609ea6237275d93eb9c36",
};

// ✅ check muna kung may existing app bago gumawa ng bago
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export database instance
export const rtdb = getDatabase(app);
