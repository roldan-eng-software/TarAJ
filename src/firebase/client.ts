// Firebase Client SDK Configuration
// This file initializes the Firebase client SDK for browser use
// Lazy initialization to avoid SSR/prerender issues

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function getApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase client SDK cannot be used on the server during prerendering');
  }
  if (!app) {
    app = initializeApp(getFirebaseConfig());
  }
  return app;
}

export function getAuthInstance(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getApp());
  }
  return authInstance;
}

export function getFirestoreInstance(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getApp());
  }
  return dbInstance;
}
