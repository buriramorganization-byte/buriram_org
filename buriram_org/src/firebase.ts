import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB-Np7AlWLgAqmpIMiAFrx8-HnVzHpOEOc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0893437601.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0893437601",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0893437601.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1009971747790",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1009971747790:web:246627bd21b557ea40e99f"
};

const app = initializeApp(firebaseConfig);
const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-71f48580-4f59-49a1-8c82-523f2b2eb5c7";
const db = getFirestore(app, dbId);

export { app, db };


