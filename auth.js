import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCP0dki2CRdbpr1jC7OrD4-3Y6QCQI0B0",
  authDomain: "trend-radar-saas-koo.firebaseapp.com",
  projectId: "trend-radar-saas-koo",
  storageBucket: "trend-radar-saas-koo.firebasestorage.app",
  messagingSenderId: "366088888290",
  appId: "1:366088888290:web:6f04e0583ed32ae94e23bb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut };
