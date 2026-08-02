import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBoxyhDjJAdnjoGE-RMBPOKEh0e6uihVu0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "formease-5d57d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "formease-5d57d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "formease-5d57d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1049626584991",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1049626584991:web:932506aaa2cac4535bbfaa",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-N2KF3VBER4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);