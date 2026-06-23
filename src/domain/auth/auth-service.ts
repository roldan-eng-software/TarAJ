// Authentication Service (Server-side only)
// Session verification and internal profile loading

import { adminAuth, adminDb } from '@/src/firebase/admin';
import type { SessionUser, User } from '@/src/types/domain';

/**
 * Verify a Firebase session cookie and return the session user
 * Auto-creates user profile if it doesn't exist yet (first-login bootstrap)
 */
export async function getSessionUserFromCookie(sessionCookie: string): Promise<SessionUser | null> {
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    const userRef = adminDb.collection('users').doc(decodedClaims.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const now = new Date();
      const userData = {
        displayName: decodedClaims.name || decodedClaims.email?.split('@')[0] || 'User',
        email: decodedClaims.email || '',
        roleId: 'internal_reader' as const,
        status: 'active' as const,
        createdAt: now,
        createdBy: 'system',
        updatedAt: now,
        updatedBy: 'system',
      };

      await userRef.set(userData);
      console.log(`Auto-created user profile for ${decodedClaims.uid}`);

      return {
        uid: decodedClaims.uid,
        email: userData.email,
        displayName: userData.displayName,
        roleId: userData.roleId,
        permissions: [],
      };
    }

    const userData = userDoc.data() as User;

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      displayName: userData.displayName,
      roleId: userData.roleId,
      permissions: [],
    };
  } catch (error) {
    console.error('Session cookie verification failed:', error);
    return null;
  }
}

/**
 * Authenticate with Firebase ID token (legacy / Bearer auth)
 */
export async function getSessionUser(token: string): Promise<SessionUser | null> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken) return null;

    const userRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const now = new Date();
      const userData = {
        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        email: decodedToken.email || '',
        roleId: 'internal_reader' as const,
        status: 'active' as const,
        createdAt: now,
        createdBy: 'system',
        updatedAt: now,
        updatedBy: 'system',
      };

      await userRef.set(userData);
      console.log(`Auto-created user profile for ${decodedToken.uid}`);

      return {
        uid: decodedToken.uid,
        email: userData.email,
        displayName: userData.displayName,
        roleId: userData.roleId,
        permissions: [],
      };
    }

    const userData = userDoc.data() as User;

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: userData.displayName,
      roleId: userData.roleId,
      permissions: [],
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * Create a new user (admin only)
 */
export async function createUser(
  email: string,
  displayName: string,
  roleId: string
): Promise<void> {
  // Create Firebase Auth user
  const userRecord = await adminAuth.createUser({
    email,
    displayName,
  });

  // Create internal user profile in Firestore
  const now = new Date();
  await adminDb.collection('users').doc(userRecord.uid).set({
    displayName,
    email,
    roleId,
    status: 'active',
    createdAt: now,
    createdBy: 'system',
    updatedAt: now,
    updatedBy: 'system',
  });
}

/**
 * Disable user (admin only)
 */
export async function disableUser(userId: string): Promise<void> {
  await adminAuth.updateUser(userId, { disabled: true });

  const now = new Date();
  await adminDb.collection('users').doc(userId).update({
    status: 'disabled',
    updatedAt: now,
    updatedBy: 'system',
  });
}
