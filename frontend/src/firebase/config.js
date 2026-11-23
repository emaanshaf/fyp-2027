import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBNTPg8BCmFGQRe17c9ZJMEk1CUHqyeBGE',
  authDomain: 'emaan-fyp-2027.firebaseapp.com',
  projectId: 'emaan-fyp-2027',
  storageBucket: 'emaan-fyp-2027.firebasestorage.app',
  messagingSenderId: '396837560593',
  appId: '1:396837560593:web:cf1504c7fc2c544e966cb0',
  measurementId: 'G-6HKXRXSJNY',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);

export const isFirebaseConfigured = () => !!firebaseConfig.apiKey;

export { auth, db };