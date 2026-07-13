/**
 * Firebase Configuration - My Bakery Store
 * Shared between the main site (index.html) and admin panel (admin.html).
 * Loaded AFTER the Firebase CDN compat scripts in each HTML file.
 */

const firebaseConfig = {
    apiKey: "AIzaSyCLqz4vlMO5Euc3-0R3y0Cw6MIUyS8son4",
    authDomain: "my-bakery-store.firebaseapp.com",
    projectId: "my-bakery-store",
    storageBucket: "my-bakery-store.firebasestorage.app",
    messagingSenderId: "3658709129",
    appId: "1:3658709129:web:9e7f3e275e5cb6348e6e58"
};

// Initialize Firebase app (compat mode — no npm/bundler needed)
firebase.initializeApp(firebaseConfig);

// Firestore instance — available in both site and admin
const db = firebase.firestore();

// Auth instance — only initialised if firebase-auth-compat.js is loaded (admin panel only)
const auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;

// Storage instance — only initialised if firebase-storage-compat.js is loaded (admin panel only)
const storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;
