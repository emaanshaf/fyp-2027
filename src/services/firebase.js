// Firebase Service Layer - Centralized Firebase operations
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { SYNCED_KEYS } from '../firebase/syncedStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FirebaseService {
  constructor() {
    this.auth = auth;
    this.db = db;
    this.isConfigured = isFirebaseConfigured();
  }

  // Auth
  async signIn(email, password) {
    if (!this.isConfigured) throw new Error('Firebase not configured');
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    await this.pullSyncedData(cred.user.uid);
    return cred.user;
  }

  async signUp(email, password, displayName) {
    if (!this.isConfigured) throw new Error('Firebase not configured');
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    await this.pullSyncedData(cred.user.uid);
    return cred.user;
  }

  async signOut() {
    if (!this.isConfigured) return;
    await firebaseSignOut(this.auth);
    await AsyncStorage.multiRemove(['qitab_user_name', 'qitab_guest']);
  }

  async resetPassword(email) {
    if (!this.isConfigured) throw new Error('Firebase not configured');
    await sendPasswordResetEmail(this.auth, email);
  }

  onAuthStateChange(callback) {
    if (!this.isConfigured) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(this.auth, callback);
  }

  getCurrentUser() {
    return this.auth?.currentUser || null;
  }

  // Data Sync
  async pullSyncedData(uid) {
    if (!this.isConfigured || !uid) return;
    try {
      const snap = await getDoc(doc(this.db, 'users', uid));
      if (!snap.exists()) return;
      const remote = snap.data();
      for (const key of SYNCED_KEYS) {
        if (remote[key] === undefined) continue;
        const local = await AsyncStorage.getItem(key);
        if (local === null) {
          await AsyncStorage.setItem(key, remote[key]);
        }
      }
    } catch (error) {
      console.warn('Failed to pull synced data:', error);
    }
  }

  async pushSyncedData(uid, data) {
    if (!this.isConfigured || !uid) return;
    try {
      await setDoc(doc(this.db, 'users', uid), data, { merge: true });
    } catch (error) {
      console.warn('Failed to push synced data:', error);
    }
  }

  // Generic Firestore operations
  async getDocument(collectionName, id) {
    if (!this.isConfigured) return null;
    const snap = await getDoc(doc(this.db, collectionName, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async setDocument(collectionName, id, data) {
    if (!this.isConfigured) return;
    await setDoc(doc(this.db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async updateDocument(collectionName, id, data) {
    if (!this.isConfigured) return;
    await updateDoc(doc(this.db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteDocument(collectionName, id) {
    if (!this.isConfigured) return;
    await deleteDoc(doc(this.db, collectionName, id));
  }

  async queryDocuments(collectionName, constraints = []) {
    if (!this.isConfigured) return [];
    const q = query(collection(this.db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  subscribeToDocument(collectionName, id, callback) {
    if (!this.isConfigured) return () => {};
    const unsubscribe = onSnapshot(doc(this.db, collectionName, id), (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsubscribe;
  }

  subscribeToCollection(collectionName, constraints = [], callback) {
    if (!this.isConfigured) return () => {};
    const q = query(collection(this.db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
    return unsubscribe;
  }

  // User-specific data helpers
  getUserDocRef(uid, subcollection = null, subId = null) {
    let ref = doc(this.db, 'users', uid);
    if (subcollection) {
      ref = doc(ref, subcollection, subId || '');
    }
    return ref;
  }

  async getUserData(uid, key) {
    if (!this.isConfigured || !uid) return null;
    const snap = await getDoc(doc(this.db, 'users', uid));
    return snap.exists() ? snap.data()[key] : null;
  }

  async setUserData(uid, key, value) {
    if (!this.isConfigured || !uid) return;
    await setDoc(doc(this.db, 'users', uid), { [key]: value }, { merge: true });
  }

  async batchWrite(operations) {
    if (!this.isConfigured) return;
    const batch = writeBatch(this.db);
    operations.forEach(({ type, collection: coll, id, data }) => {
      const ref = doc(this.db, coll, id);
      if (type === 'set') batch.set(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      else if (type === 'update') batch.update(ref, { ...data, updatedAt: serverTimestamp() });
      else if (type === 'delete') batch.delete(ref);
    });
    await batch.commit();
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;