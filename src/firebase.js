import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAeSd0Ql-FUixSSMlGH54hFU1oZ_7OYuBo",
  authDomain: "fitness-tracker-711d6.firebaseapp.com",
  projectId: "fitness-tracker-711d6",
  storageBucket: "fitness-tracker-711d6.appspot.com",
  messagingSenderId: "532206590056",
  appId: "1:532206590056:web:a8416fd887f6395505c3dd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, firestore, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup };
