// Audit Service
// Immutable audit logging for security and compliance

import { adminDb } from '@/src/firebase/admin';
import type { AuditLog, PermissionAction, ResourceType } from '@/src/types/domain';
import { generateRequestId } from '@/src/lib/request-id';

/**
 * Log an audit event
 */
export async function logAudit(
  actor: string,
  actorRole: string,
  action: PermissionAction,
  resourceType: ResourceType,
  resourceId: string,
  result: 'success' | 'denied' | 'failed',
  metadata?: Record<string, unknown>
): Promise<string> {
  const now = new Date();
  const requestId = generateRequestId();

  const auditLog: Omit<AuditLog, 'id'> = {
    actor,
    actorRole: actorRole as any,
    action,
    resourceType,
    resourceId,
    result,
    metadata,
    occurredAt: now,
    requestId,
  };

  // Append to audit logs (immutable)
  const ref = await adminDb.collection('auditLogs').add(auditLog);

  return ref.id;
}

/**
 * Log successful action
 */
export async function logSuccess(
  actor: string,
  actorRole: string,
  action: PermissionAction,
  resourceType: ResourceType,
  resourceId: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  return logAudit(actor, actorRole, action, resourceType, resourceId, 'success', metadata);
}

/**
 * Log denied action
 */
export async function logDenied(
  actor: string,
  actorRole: string,
  action: PermissionAction,
  resourceType: ResourceType,
  resourceId: string
): Promise<string> {
  return logAudit(actor, actorRole, action, resourceType, resourceId, 'denied', {
    reason: 'Authorization check failed',
  });
}

/**
 * Log failed action
 */
export async function logFailed(
  actor: string,
  actorRole: string,
  action: PermissionAction,
  resourceType: ResourceType,
  resourceId: string,
  error: unknown
): Promise<string> {
  return logAudit(actor, actorRole, action, resourceType, resourceId, 'failed', {
    error: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  email: string,
  success: boolean,
  error?: string
): Promise<string> {
  const now = new Date();
  const requestId = generateRequestId();

  await adminDb.collection('auditLogs').add({
    actor: email,
    actorRole: 'system',
    action: 'view' as any,
    resourceType: 'user' as any,
    resourceId: email,
    result: success ? ('success' as const) : ('failed' as const),
    metadata: {
      eventType: 'login_attempt',
      error,
    },
    occurredAt: now,
    requestId,
  });

  return requestId;
}

/**
 * Query audit logs
 */
export async function getAuditLogs(
  resourceType?: ResourceType,
  resourceId?: string,
  limit: number = 100
): Promise<AuditLog[]> {
  let query: FirebaseFirestore.Query = adminDb.collection('auditLogs');

  if (resourceType) {
    query = query.where('resourceType', '==', resourceType);
  }

  if (resourceId) {
    query = query.where('resourceId', '==', resourceId);
  }

  const snapshot = await query.orderBy('occurredAt', 'desc').limit(limit).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    occurredAt: doc.data().occurredAt.toDate(),
  })) as AuditLog[];
}
