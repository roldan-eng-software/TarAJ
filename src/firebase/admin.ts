// Firebase Admin SDK Configuration
// This file initializes the Firebase Admin SDK for server-side use
// Should only be imported in server-side code and Route Handlers

import * as admin from 'firebase-admin';

const adminSDKKey = process.env.FIREBASE_ADMIN_SDK_KEY;

if (!admin.apps.length) {
  let serviceAccount;

  try {
    // Try to parse as JSON first
    if (adminSDKKey && adminSDKKey.startsWith('{')) {
      serviceAccount = JSON.parse(adminSDKKey);
    } else {
      // Otherwise, assume it's a file path and require it
      serviceAccount = require(adminSDKKey || '');
    }
  } catch (error) {
    console.warn(
      'Firebase Admin SDK not configured. Server-side operations will fail.',
      error
    );
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const FieldValue = admin.firestore.FieldValue;

export default admin;
