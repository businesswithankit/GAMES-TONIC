import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA1WfBFhSz-iU-5fJUSlKM0jrKbvo_WvN8",
  authDomain: "gaming-site-10add.firebaseapp.com",
  databaseURL: "https://gaming-site-10add-default-rtdb.firebaseio.com",
  projectId: "gaming-site-10add",
  storageBucket: "gaming-site-10add.firebasestorage.app",
  messagingSenderId: "488655947713",
  appId: "1:488655947713:web:720dfd4907fb8d767d1140",
  measurementId: "G-LKRSXEM23R"
};

// Initialize Firebase safely for hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
