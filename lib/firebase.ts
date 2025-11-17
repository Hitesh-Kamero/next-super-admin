// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsP_QngShx9GAygD3wwapSxshSJVyEXU4",
  authDomain: "kamero.firebaseapp.com",
  projectId: "kamero",
  storageBucket: "kamero.firebasestorage.app",
  messagingSenderId: "756098848813",
  appId: "1:756098848813:web:8b232006918e8121eb80a4"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;

