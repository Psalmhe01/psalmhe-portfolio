// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const emulated = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const app = initializeApp(emulated ? { ...firebaseConfig, projectId: "demo-portfolio", apiKey: "demo-key", authDomain: "demo-portfolio.firebaseapp.com" } : firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
if (emulated) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
