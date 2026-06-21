import { vi } from 'vitest';

process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '000000000000';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:000000000000:web:abcdef';

vi.mock('@/src/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      add: vi.fn(),
      where: vi.fn(() => ({
        where: vi.fn(),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(),
            offset: vi.fn(() => ({
              get: vi.fn(),
            })),
          })),
          get: vi.fn(),
        })),
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
        count: vi.fn(() => ({
          get: vi.fn(),
        })),
        get: vi.fn(),
      })),
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(),
          offset: vi.fn(() => ({
            get: vi.fn(),
          })),
        })),
        get: vi.fn(),
      })),
      limit: vi.fn(() => ({
        get: vi.fn(),
      })),
      get: vi.fn(),
      batch: vi.fn(() => ({
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn(),
      })),
    })),
    batch: vi.fn(() => ({
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(),
    })),
    doc: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    runTransaction: vi.fn(),
  },
  adminStorage: {
    bucket: vi.fn(() => ({
      file: vi.fn(() => ({
        getSignedUrl: vi.fn(),
        delete: vi.fn(),
        save: vi.fn(),
      })),
    })),
  },
  FieldValue: {
    serverTimestamp: vi.fn(() => new Date()),
    delete: vi.fn(),
  },
  isStorageAvailable: vi.fn(() => true),
}));

vi.mock('@vercel/blob', () => ({
  put: vi.fn(() => Promise.resolve({ url: 'https://test.blob.vercel-storage.com/test-file' })),
  del: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn(() => Promise.resolve({ accepted: ['test@example.com'] })),
  })),
}));
