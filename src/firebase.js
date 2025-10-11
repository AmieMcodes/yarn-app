import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
} from "firebase/auth";

// Your Firebase web app config (client-safe)
const firebaseConfig = {
  apiKey: "AIzaSyAbhcxywDpPJkK4YoEqDFfAyD9-drvTSJc",
  authDomain: "yarn-app-41a96.firebaseapp.com",
  projectId: "yarn-app-41a96",
  storageBucket: "yarn-app-41a96.firebasestorage.app",
  messagingSenderId: "102278743577",
  appId: "1:102278743577:web:b3dc7f6fe18f9e7ca18c88",
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Auth (persist across refreshes)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Google provider (for Google sign-in)
export const googleProvider = new GoogleAuthProvider();

export default app;
