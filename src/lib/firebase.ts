import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDtwTNPnERtXXfiblK_feggZjdSMJkLGyM",
  authDomain: "maineneeds-f995f.firebaseapp.com",
  projectId: "maineneeds-f995f",
  storageBucket: "maineneeds-f995f.firebasestorage.app",
  messagingSenderId: "811800552624",
  appId: "1:811800552624:web:12178034d1f81003d3c775",
  measurementId: "G-3ZY5FDPZ0S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 