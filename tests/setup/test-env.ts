import { vi } from 'vitest';

process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app';

vi.mock('@/src/firebase/client', () => ({
  auth: {},
  db: {},
  storage: {},
  default: {},
}));

vi.mock('@/src/firebase/admin', () => ({
  adminAuth: {},
  adminDb: {},
  adminStorage: {},
  default: {},
}));
