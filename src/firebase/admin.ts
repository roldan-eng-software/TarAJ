// Firebase Admin SDK Configuration
// Lazy initialization for server-side use to prevent build-time failures

import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

let _initialized = false;
let _initError: Error | null = null;

function ensureInit(): void {
  if (_initialized) return;
  if (_initError) throw _initError;
  if (admin.apps.length) {
    _initialized = true;
    return;
  }

  const key = process.env.FIREBASE_ADMIN_SDK_KEY;
  if (!key) {
    _initError = new Error('FIREBASE_ADMIN_SDK_KEY not set');
    console.warn('Firebase Admin SDK not configured: FIREBASE_ADMIN_SDK_KEY not set.');
    throw _initError;
  }

  try {
    let serviceAccount: admin.ServiceAccount;
    if (key.startsWith('{')) {
      serviceAccount = JSON.parse(key);
    } else if (existsSync(key)) {
      const content = readFileSync(key, 'utf-8');
      serviceAccount = JSON.parse(content);
    } else {
      throw new Error(`Cannot find service account key file: ${key}`);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    admin.firestore().settings({ ignoreUndefinedProperties: true });
    _initialized = true;
  } catch (error) {
    _initError = error instanceof Error ? error : new Error(String(error));
    console.warn('Firebase Admin SDK not configured:', _initError.message);
    throw _initError;
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
    const instance = admin.auth();
    const val = (instance as any)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop: string | symbol) {
    assertReady();
    const instance = admin.firestore();
    const val = (instance as any)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(_target, prop: string | symbol) {
    assertReady();
    const instance = admin.storage();
    const val = (instance as any)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export function isStorageAvailable(): boolean {
  try {
    ensureInit();
    admin.storage();
    return true;
  } catch {
    return false;
  }
}

export const FieldValue = admin.firestore.FieldValue;

export default admin;
