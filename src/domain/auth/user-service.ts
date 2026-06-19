// User Management Service
// Server-side CRUD for internal user profiles with audit logging
// Only administrators can manage users (enforced by RBAC)

import { adminAuth, adminDb } from '@/src/firebase/admin';
import { logSuccess } from '@/src/domain/audit/audit-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import type { User, RoleId, SessionUser } from '@/src/types/domain';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface CreateUserInput {
  email: string;
  displayName: string;
  roleId: RoleId;
  password: string;
}

export interface UpdateUserInput {
  displayName?: string;
  roleId?: RoleId;
  status?: 'active' | 'disabled';
}

export interface UserWithId extends User {
  id: string;
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<RoleId, string> = {
  administrator: 'Administrador',
  coordinator: 'Coordenador',
  collaborator: 'Colaborador',
  internal_reader: 'Leitor Interno',
};

export function getRoleLabel(roleId: RoleId): string {
  return ROLE_LABELS[roleId] ?? roleId;
}

export function getAllRoles(): { id: RoleId; label: string }[] {
  return Object.entries(ROLE_LABELS).map(([id, label]) => ({
    id: id as RoleId,
    label,
  }));
}

// ────────────────────────────────────────────────────────────────
// List users
// ────────────────────────────────────────────────────────────────

export async function listUsers(
  actor: SessionUser,
  filters?: { status?: string; roleId?: string; q?: string },
  limit = 100
): Promise<UserWithId[]> {
  assertCan(actor, 'manage', 'user');

  let query: FirebaseFirestore.Query = adminDb.collection('users');

  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters?.roleId) {
    query = query.where('roleId', '==', filters.roleId);
  }

  const snapshot = await query.orderBy('displayName').limit(limit).get();

  let users = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
    } as UserWithId;
  });

  // Client-side text search (Firestore doesn't support full-text natively)
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    users = users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }

  return users;
}

// ────────────────────────────────────────────────────────────────
// Get single user
// ────────────────────────────────────────────────────────────────

export async function getUser(
  actor: SessionUser,
  userId: string
): Promise<UserWithId | null> {
  assertCan(actor, 'manage', 'user');

  const doc = await adminDb.collection('users').doc(userId).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
  } as UserWithId;
}

// ────────────────────────────────────────────────────────────────
// Create user (Firebase Auth + Firestore profile)
// ────────────────────────────────────────────────────────────────

export async function createUserFull(
  input: CreateUserInput,
  actor: SessionUser
): Promise<UserWithId> {
  assertCan(actor, 'manage', 'user');

  // Create Firebase Auth account
  const userRecord = await adminAuth.createUser({
    email: input.email,
    displayName: input.displayName,
    password: input.password,
    disabled: false,
  });

  const now = new Date();
  const userData: Omit<User, 'id'> = {
    displayName: input.displayName,
    email: input.email,
    roleId: input.roleId,
    status: 'active',
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  await adminDb.collection('users').doc(userRecord.uid).set(userData);

  // Audit
  await logSuccess(actor.uid, actor.roleId, 'manage', 'user', userRecord.uid, {
    action: 'create_user',
    email: input.email,
    roleId: input.roleId,
  });

  return { id: userRecord.uid, ...userData } as UserWithId;
}

// ────────────────────────────────────────────────────────────────
// Update user (role, displayName, status)
// ────────────────────────────────────────────────────────────────

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
  actor: SessionUser
): Promise<UserWithId> {
  assertCan(actor, 'manage', 'user');

  const userRef = adminDb.collection('users').doc(userId);
  const existing = await userRef.get();
  if (!existing.exists) {
    throw new Error('User not found');
  }

  const previousData = existing.data() as User;
  const now = new Date();

  const updates: Record<string, unknown> = {
    updatedAt: now,
    updatedBy: actor.uid,
  };

  if (input.displayName !== undefined) {
    updates.displayName = input.displayName;
    // Sync with Firebase Auth
    await adminAuth.updateUser(userId, { displayName: input.displayName });
  }

  if (input.roleId !== undefined) {
    updates.roleId = input.roleId;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
    // Sync disabled state with Firebase Auth
    await adminAuth.updateUser(userId, {
      disabled: input.status === 'disabled',
    });
  }

  await userRef.update(updates);

  // Audit with before/after
  await logSuccess(actor.uid, actor.roleId, 'manage', 'user', userId, {
    action: 'update_user',
    changes: Object.keys(updates).filter((k) => k !== 'updatedAt' && k !== 'updatedBy'),
    previousRole: previousData.roleId,
    newRole: input.roleId ?? previousData.roleId,
    previousStatus: previousData.status,
    newStatus: input.status ?? previousData.status,
  });

  const updatedDoc = await userRef.get();
  const data = updatedDoc.data()!;
  return {
    id: userId,
    ...data,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
  } as UserWithId;
}

// ────────────────────────────────────────────────────────────────
// Reset password (sends password reset email)
// ────────────────────────────────────────────────────────────────

export async function resetUserPassword(
  userId: string,
  actor: SessionUser
): Promise<string> {
  assertCan(actor, 'manage', 'user');

  const userDoc = await adminDb.collection('users').doc(userId).get();
  if (!userDoc.exists) throw new Error('User not found');

  const email = (userDoc.data() as User).email;
  const resetLink = await adminAuth.generatePasswordResetLink(email);

  await logSuccess(actor.uid, actor.roleId, 'manage', 'user', userId, {
    action: 'password_reset',
    email,
  });

  return resetLink;
}
