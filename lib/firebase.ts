import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
 // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  apiKey: "AIzaSyD0mHb7zzFXI0QTqySRbD93TQbriipWZlM",
  authDomain: "hackathon-6e2ee.firebaseapp.com",
  projectId: "hackathon-6e2ee",
  storageBucket: "hackathon-6e2ee.firebasestorage.app",
  messagingSenderId: "105551471684",
  appId: "1:105551471684:web:acd16a7f473f5d87e60811",
  measurementId: "G-Q1Z8W515S0"

};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export default app;