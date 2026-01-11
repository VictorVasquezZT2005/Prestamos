import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBYjF7bSFXohewhUISsWD6EYgb0NNWXrPY",
  authDomain: "prestamos-640c4.firebaseapp.com",
  projectId: "prestamos-640c4",
  storageBucket: "prestamos-640c4.firebasestorage.app",
  messagingSenderId: "492100440888",
  appId: "1:492100440888:web:f3b0c8a5c1cf62b44b27cd",
};

const app = initializeApp(firebaseConfig);

export const firestore = getFirestore(app); 
export const db = getFirestore(app);
export const auth = getAuth(app);