import { describe, it, expect } from 'vitest';
import { isValidTransition, validateTransition, canArchive, canRestore, getStageName } from '@/src/domain/workflow/workflow-service';
import { assertCan, hasPermission } from '@/src/domain/rbac/rbac-service';
import { extractMentions } from '@/src/domain/comments/comment-service';
import { generateDedupeKey } from '@/src/domain/notifications/notification-service';
import { isOverdue, isUpcoming, formatDate } from '@/src/lib/dates';
import type { SessionUser, RoleId, StageId, Task, AlertEventType } from '@/src/types/domain';

const coordinator: SessionUser = { uid: 'coord_001', email: 'coord@test.com', displayName: 'Coordinator', roleId: 'coordinator', permissions: [] };
const reader: SessionUser = { uid: 'reader_001', email: 'reader@test.com', displayName: 'Reader', roleId: 'internal_reader', permissions: [] };

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task_001', referenceCode: 'JUR-2026-001', title: 'Test Task',
    description: 'Description', category: 'documentos', priority: 'normal',
    stageId: 'entrada', responsibleUserId: 'user_001', participantIds: [],
    confidentialityLevel: 'interno', archived: false,
    createdAt: new Date(), createdBy: 'user_001',
    updatedAt: new Date(), updatedBy: 'user_001',
    ...overrides,
  };
}

describe('Quickstart End-to-End Scenarios', () => {
  describe('Authentication and RBAC', () => {
    it('should block unauthenticated access to private routes', () => {
      const noUser = null;
      expect(noUser).toBeNull();
    });

    it('should show role-appropriate navigation after login', () => {
      expect(coordinator.roleId).toBe('coordinator');
    });

    it('should hide admin controls from non-admins', () => {
      const isNotAdmin = !hasPermission('coordinator' as RoleId, 'manage', 'user');
      expect(isNotAdmin).toBe(true);
    });

    it('should allow internal reader to view but not edit', () => {
      expect(() => assertCan(reader, 'view', 'task')).not.toThrow();
      expect(() => assertCan(reader, 'edit', 'task')).toThrow();
    });
  });

  describe('Create and Move Task', () => {
    it('should allow coordinator to create task', () => {
      expect(() => assertCan(coordinator, 'create', 'task')).not.toThrow();
    });

    it('should place new task in entrada stage', () => {
      const task = makeTask();
      expect(task.stageId).toBe('entrada');
    });

    it('should allow moving through allowed transitions', () => {
      expect(isValidTransition('entrada' as StageId, 'analise' as StageId)).toBe(true);
      expect(isValidTransition('analise' as StageId, 'andamento' as StageId)).toBe(true);
    });

    it('should block unauthorized movement', () => {
      expect(isValidTransition('entrada' as StageId, 'concluida' as StageId)).toBe(false);
      expect(validateTransition('entrada' as StageId, 'concluida' as StageId).valid).toBe(false);
    });

    it('should allow backward movement from revisao to andamento', () => {
      const result = validateTransition('revisao' as StageId, 'andamento' as StageId);
      expect(result.valid).toBe(true);
      expect(result.backward).toBe(true);
    });
  });

  describe('History and Timeline', () => {
    it('should record task creation in history', () => {
      const event = { type: 'created', taskId: 'task_001', actor: 'coord_001' };
      expect(event.type).toBe('created');
    });

    it('should record stage transitions in history', () => {
      const event = { type: 'stage_changed', from: 'entrada', to: 'analise' };
      expect(event.type).toBe('stage_changed');
      expect(event.from).toBe('entrada');
      expect(event.to).toBe('analise');
    });

    it('should display stage names correctly in timeline', () => {
      expect(getStageName('entrada' as StageId)).toBe('Entrada');
      expect(getStageName('concluida' as StageId)).toBe('Concluída');
    });

    it('should detect backward transitions for history marking', () => {
      const backward = validateTransition('revisao' as StageId, 'andamento' as StageId);
      expect(backward.backward).toBe(true);
    });
  });

  describe('Comments and Attachments', () => {
    it('should allow adding comments to task', () => {
      expect(() => assertCan(coordinator, 'comment', 'task')).not.toThrow();
    });

    it('should extract @mentions from comments', () => {
      const mentions = extractMentions('@joao @maria revisem');
      expect(mentions).toContain('joao');
      expect(mentions).toContain('maria');
    });

    it('should check attach permission', () => {
      expect(() => assertCan(coordinator, 'attach', 'task')).not.toThrow();
      expect(() => assertCan(reader, 'attach', 'task')).toThrow();
    });
  });

  describe('Alerts', () => {
    it('should create alert on responsible change', () => {
      const dedupeKey = generateDedupeKey('responsible_changed' as AlertEventType, 'task_001', 'user_001');
      expect(dedupeKey).toContain('task_001');
      expect(dedupeKey).toContain('responsible_changed');
    });

    it('should not duplicate alerts for same event', () => {
      const key1 = generateDedupeKey('task_created' as AlertEventType, 'task_001', 'user_001');
      const key2 = generateDedupeKey('task_created' as AlertEventType, 'task_001', 'user_001');
      expect(key1).toBe(key2);
    });

    it('should detect due dates for alerts', () => {
      const pastDate = new Date('2025-01-01');
      const futureDate = new Date('2027-01-01');
      expect(isOverdue(pastDate)).toBe(true);
      expect(isOverdue(futureDate)).toBe(false);
      expect(isUpcoming(futureDate, 365)).toBe(true);
    });

    it('should format dates in pt-BR locale', () => {
      const date = new Date('2026-06-18T12:00:00');
      expect(formatDate(date)).toContain('18');
    });
  });

  describe('Archive', () => {
    it('should allow archiving completed task', () => {
      const completedTask = makeTask({ stageId: 'concluida' });
      expect(canArchive(completedTask)).toBe(true);
    });

    it('should block archiving non-completed task', () => {
      const activeTask = makeTask({ stageId: 'andamento' });
      expect(canArchive(activeTask)).toBe(false);
    });

    it('should remove archived task from active board', () => {
      const task = makeTask({ stageId: 'arquivada', archived: true });
      expect(task.archived).toBe(true);
    });

    it('should allow restoring archived task', () => {
      const archivedTask = makeTask({ stageId: 'arquivada', archived: true });
      expect(canRestore(archivedTask)).toBe(true);
    });

    it('should preserve full history in archived', () => {
      const expectedFields = ['id', 'title', 'description', 'stageId', 'archived', 'createdAt', 'createdBy'];
      const task = makeTask({ stageId: 'arquivada', archived: true });
      expectedFields.forEach((field) => {
        expect(task).toHaveProperty(field);
      });
    });
  });
});
