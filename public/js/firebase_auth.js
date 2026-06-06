import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFqUc84cVQdCACpG7YW_kAGQDQWWnw-FE",
  authDomain: "flyawaytravelplanner.firebaseapp.com",
  projectId: "flyawaytravelplanner",
  storageBucket: "flyawaytravelplanner.firebasestorage.app",
  messagingSenderId: "331445729032",
  appId: "1:331445729032:web:c73983ab819f4081b21ebd",
  measurementId: "G-26XT22ZWJS",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    const response = await fetch("/auth/firebase-google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        avatarUrl: firebaseUser.photoURL,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save Google user.");
    }

    window.location.href = data.redirectTo || "/profile";
  } catch (error) {
    console.error("Google sign-in error:", error);
    alert("Google sign-in failed. Please try again.");
  }
}

window.signInWithGoogle = signInWithGoogle;