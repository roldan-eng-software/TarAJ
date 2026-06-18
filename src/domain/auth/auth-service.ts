// Authentication Service
// Session verification and internal profile loading

import { auth } from '@/src/firebase/client';
import { adminAuth, adminDb } from '@/src/firebase/admin';
import type { SessionUser, User } from '@/src/types/domain';

/**
 * Get current Firebase user from client-side auth
 */
export async function getCurrentFirebaseUser() {
  return auth.currentUser;
}

/**
 * Get session from cookies or client auth
 * Auto-creates user profile if it doesn't exist yet (first-login bootstrap)
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
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  return auth.signOut();
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
