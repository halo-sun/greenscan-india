// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSxHoVB4tc1z5WGyRkIaSgEXaFporTtF4",
  authDomain: "greenscan-india.firebaseapp.com",
  projectId: "greenscan-india",
  storageBucket: "greenscan-india.firebasestorage.app",
  messagingSenderId: "388910918118",
  appId: "1:388910918118:web:bb7aacf82367b0fdd94e27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);