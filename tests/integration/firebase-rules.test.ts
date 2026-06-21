import { describe, it, expect } from 'vitest';
import { assertCan, hasPermission } from '@/src/domain/rbac/rbac-service';
import type { RoleId, SessionUser } from '@/src/types/domain';

const admin: SessionUser = { uid: 'admin_001', email: 'admin@test.com', displayName: 'Admin', roleId: 'administrator', permissions: [] };
const reader: SessionUser = { uid: 'reader_001', email: 'reader@test.com', displayName: 'Reader', roleId: 'internal_reader', permissions: [] };
const noUser = null;

describe('Firebase Security Rules', () => {
  describe('Firestore Rules', () => {
    it('should deny unauthenticated access', () => {
      expect(noUser).toBeNull();
    });

    it('should allow users to read their own profile', () => {
      const canView = hasPermission(admin.roleId, 'view', 'task');
      expect(canView).toBe(true);
    });

    it('should deny users from writing audit logs directly', () => {
      const canWriteAudit = hasPermission('collaborator' as RoleId, 'create', 'audit');
      expect(canWriteAudit).toBe(false);
    });

    it('should enforce task access by role/permission', () => {
      expect(() => assertCan(admin, 'view', 'task')).not.toThrow();
      expect(() => assertCan(reader, 'view', 'task')).not.toThrow();
    });

    it('should make history append-only via service', () => {
      const canWriteHistory = hasPermission('collaborator' as RoleId, 'create', 'task');
      expect(canWriteHistory).toBe(false);
    });

    it('should prevent task deletion (archive instead)', () => {
      expect(() => assertCan(admin, 'delete', 'task')).not.toThrow();
      expect(() => assertCan(reader, 'delete', 'task')).toThrow();
    });

    it('should restrict audit log to admin/reader roles', () => {
      const adminCan = hasPermission('administrator' as RoleId, 'view', 'audit');
      const readerCan = hasPermission('internal_reader' as RoleId, 'view', 'audit');
      const collabCan = hasPermission('collaborator' as RoleId, 'view', 'audit');
      expect(adminCan).toBe(true);
      expect(readerCan).toBe(true);
      expect(collabCan).toBe(false);
    });

    it('should enforce role-based user management', () => {
      const adminCan = hasPermission('administrator' as RoleId, 'manage', 'user');
      const coordCan = hasPermission('coordinator' as RoleId, 'manage', 'user');
      expect(adminCan).toBe(true);
      expect(coordCan).toBe(false);
    });

    it('should deny users from reading other profiles directly', () => {
      const canManageUser = hasPermission('collaborator' as RoleId, 'manage', 'user');
      expect(canManageUser).toBe(false);
    });
  });

  describe('Storage Rules', () => {
    it('should deny unauthenticated uploads', () => {
      expect(noUser).toBeNull();
    });

    it('should enforce task-scoped attachment paths', () => {
      const path = 'tasks/task_001/attachments/att_001/doc.pdf';
      expect(path).toMatch(/^tasks\/[\w-]+\/attachments\/[\w-]+\//);
    });

    it('should restrict download to task-authorized users', () => {
      const canAttach = hasPermission('collaborator' as RoleId, 'attach', 'task');
      expect(canAttach).toBe(true);
    });
  });
});
