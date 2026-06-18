// Firebase Admin SDK Configuration
// Lazy initialization for server-side use to prevent build-time failures

import * as admin from 'firebase-admin';

let _initialized = false;

function ensureInit(): void {
  if (_initialized) return;
  if (admin.apps.length) {
    _initialized = true;
    return;
  }

  const key = process.env.FIREBASE_ADMIN_SDK_KEY;
  if (!key) {
    console.warn('Firebase Admin SDK not configured: FIREBASE_ADMIN_SDK_KEY not set.');
    return;
  }

  try {
    let serviceAccount: admin.ServiceAccount;
    if (key.startsWith('{')) {
      serviceAccount = JSON.parse(key);
    } else {
      serviceAccount = require(key) as admin.ServiceAccount;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    _initialized = true;
  } catch (error) {
    console.warn('Firebase Admin SDK not configured.', (error as Error).message);
  }
}

function assertReady(): void {
  ensureInit();
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized');
  }
}

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop: string | symbol) {
    assertReady();
    const val = (admin.auth() as any)[prop];
    return typeof val === 'function' ? val.bind(admin.auth()) : val;
  },
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop: string | symbol) {
    assertReady();
    const db = admin.firestore();
    const val = (db as any)[prop];
    return typeof val === 'function' ? val.bind(db) : val;
  },
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(_target, prop: string | symbol) {
    assertReady();
    const storage = admin.storage();
    const val = (storage as any)[prop];
    return typeof val === 'function' ? val.bind(storage) : val;
  },
});

export function isStorageAvailable(): boolean {
  ensureInit();
  if (!admin.apps.length) return false;
  try {
    admin.storage();
    return true;
  } catch {
    return false;
  }
}

export const FieldValue = admin.firestore.FieldValue;

export default admin;
