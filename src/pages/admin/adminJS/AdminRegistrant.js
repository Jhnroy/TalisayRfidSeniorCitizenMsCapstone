// Firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyChxzDRb2g3V2c6IeP8WF3baunT-mnnR68",
  authDomain: "rfidseniorcitizenms.firebaseapp.com",
  databaseURL: "https://rfidseniorcitizenms-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfidseniorcitizenms",
  storageBucket: "rfidseniorcitizenms.firebasestorage.app",
  messagingSenderId: "412368953505",
  appId: "1:412368953505:web:43c8b2f607e50b9fde10e0",
};

// Gamitin lang yung app kung meron na, wag mag initialize ulit
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export mo database para gamitin sa ibang components
export const rtdb = getDatabase(app);
