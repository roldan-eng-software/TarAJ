// RBAC Service
// Role-based access control with permission matrix

import type { RoleId, PermissionAction, ResourceType, Task, Permission } from '@/src/types/domain';

// Permission matrix defining what each role can do
const RBAC_MATRIX: Permission[] = [
  // Administrator - full access
  { role: 'administrator', action: 'view', resource: 'task' },
  { role: 'administrator', action: 'create', resource: 'task' },
  { role: 'administrator', action: 'edit', resource: 'task' },
  { role: 'administrator', action: 'delete', resource: 'task' },
  { role: 'administrator', action: 'move', resource: 'task' },
  { role: 'administrator', action: 'comment', resource: 'task' },
  { role: 'administrator', action: 'attach', resource: 'task' },
  { role: 'administrator', action: 'archive', resource: 'task' },
  { role: 'administrator', action: 'restore', resource: 'task' },
  { role: 'administrator', action: 'view', resource: 'audit' },
  { role: 'administrator', action: 'manage', resource: 'user' },

  { role: 'administrator', action: 'delete', resource: 'comment' },
  { role: 'administrator', action: 'delete', resource: 'attachment' },

  // Coordinator - create and manage tasks
  { role: 'coordinator', action: 'view', resource: 'task' },
  { role: 'coordinator', action: 'create', resource: 'task' },
  { role: 'coordinator', action: 'edit', resource: 'task' },
  { role: 'coordinator', action: 'move', resource: 'task' },
  { role: 'coordinator', action: 'comment', resource: 'task' },
  { role: 'coordinator', action: 'attach', resource: 'task' },
  { role: 'coordinator', action: 'archive', resource: 'task' },
  { role: 'coordinator', action: 'restore', resource: 'task' },
  { role: 'coordinator', action: 'delete', resource: 'comment' },
  { role: 'coordinator', action: 'delete', resource: 'attachment' },

  // Collaborator - limited task management
  { role: 'collaborator', action: 'view', resource: 'task' },
  { role: 'collaborator', action: 'edit', resource: 'task' },
  { role: 'collaborator', action: 'move', resource: 'task' },
  { role: 'collaborator', action: 'comment', resource: 'task' },
  { role: 'collaborator', action: 'attach', resource: 'task' },

  // Internal Reader - read-only
  { role: 'internal_reader', action: 'view', resource: 'task' },
  { role: 'internal_reader', action: 'view', resource: 'audit' },
];

/**
 * Check if a role has permission for an action on a resource
 */
export function hasPermission(
  role: RoleId,
  action: PermissionAction,
  resource: ResourceType
): boolean {
  return RBAC_MATRIX.some((p) => p.role === role && p.action === action && p.resource === resource);
}

/**
 * Check if a user can perform an action on a task
 * Takes into account both role-based permissions and task-specific scope
 */
export function canAccessTask(user: { roleId: RoleId; uid?: string; id?: string }, task: Task, action: PermissionAction): boolean {
  if (!hasPermission(user.roleId, action, 'task')) {
    return false;
  }

  if (['edit', 'comment', 'attach', 'move'].includes(action)) {
    if (user.roleId === 'collaborator') {
      const userId = user.uid || user.id || '';
      return task.responsibleUserId === userId || task.participantIds.includes(userId);
    }
  }

  return true;
}

/**
 * Assert that user can perform action, throw if not
 */
export function assertCan(
  user: { roleId: RoleId },
  action: PermissionAction,
  resource: ResourceType
): void {
  if (!hasPermission(user.roleId, action, resource)) {
    throw new Error(`User role ${user.roleId} cannot ${action} ${resource}`);
  }
}

/**
 * Assert task access, throw if not
 */
export function assertCanAccessTask(user: { roleId: RoleId; uid?: string; id?: string }, task: Task, action: PermissionAction): void {
  if (!canAccessTask(user, task, action)) {
    throw new Error(`User cannot ${action} task`);
  }
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: RoleId): Permission[] {
  return RBAC_MATRIX.filter((p) => p.role === role);
}

/**
 * Check if role is admin
 */
export function isAdmin(role: RoleId): boolean {
  return role === 'administrator';
}

/**
 * Check if role is coordinator or above
 */
export function isCoordinator(role: RoleId): boolean {
  return role === 'administrator' || role === 'coordinator';
}

/**
 * Check if role can modify tasks
 */
export function canModifyTasks(role: RoleId): boolean {
  return role === 'administrator' || role === 'coordinator' || role === 'collaborator';
}
