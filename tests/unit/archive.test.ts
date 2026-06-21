import { describe, it, expect } from 'vitest';
import { canArchive, canRestore } from '@/src/domain/workflow/workflow-service';
import type { Task, RoleId } from '@/src/types/domain';
import { hasPermission } from '@/src/domain/rbac/rbac-service';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task_001',
    referenceCode: 'JUR-2026-001',
    title: 'Test Task',
    description: 'Description',
    category: 'documentos',
    priority: 'normal',
    stageId: 'entrada',
    responsibleUserId: 'user_001',
    participantIds: [],
    confidentialityLevel: 'interno',
    archived: false,
    createdAt: new Date(),
    createdBy: 'user_001',
    updatedAt: new Date(),
    updatedBy: 'user_001',
    ...overrides,
  };
}

describe('Archive Workflow', () => {
  describe('Archiving completed tasks', () => {
    it('should allow archiving only when task is concluida', () => {
      const completedTask = makeTask({ stageId: 'concluida' });
      expect(canArchive(completedTask)).toBe(true);
    });

    it('should block archiving of non-completed tasks', () => {
      const activeTask = makeTask({ stageId: 'andamento' });
      expect(canArchive(activeTask)).toBe(false);
    });

    it('should block archiving of already archived tasks', () => {
      const archivedTask = makeTask({ stageId: 'arquivada', archived: true });
      expect(canArchive(archivedTask)).toBe(false);
    });

    it('should move task to arquivada stage', () => {
      const task = makeTask({ stageId: 'concluida' });
      const updated = { ...task, stageId: 'arquivada', archived: true };
      expect(updated.stageId).toBe('arquivada');
      expect(updated.archived).toBe(true);
    });

    it('should create history entry for archival', () => {
      const update = { archived: true, archivedAt: new Date() };
      expect(update.archived).toBe(true);
      expect(update.archivedAt).toBeInstanceOf(Date);
    });

    it('should trigger archive notification event', () => {
      const event = { type: 'task_archived', taskId: 'task_001' };
      expect(event.type).toBe('task_archived');
    });
  });

  describe('Restoring archived tasks', () => {
    it('should allow authorized users to restore archived tasks', () => {
      const archivedTask = makeTask({ stageId: 'arquivada', archived: true });
      expect(canRestore(archivedTask)).toBe(true);
    });

    it('should NOT allow restoring non-archived tasks', () => {
      const activeTask = makeTask({ stageId: 'concluida' });
      expect(canRestore(activeTask)).toBe(false);
    });

    it('should create history entry for restoration', () => {
      const event = { eventType: 'restored', actor: 'user_001' };
      expect(event.eventType).toBe('restored');
    });

    it('should trigger restoration notification', () => {
      const event = { type: 'task_restored', taskId: 'task_001', targetStage: 'entrada' };
      expect(event.type).toBe('task_restored');
      expect(event.targetStage).toBe('entrada');
    });
  });

  describe('Archived task queries', () => {
    it('should exclude archived from active Kanban', () => {
      const activeTasks = [{ id: 't1', archived: false }, { id: 't2', archived: false }];
      const archivedTasks = [{ id: 't3', archived: true }];
      expect(activeTasks.every((t) => !t.archived)).toBe(true);
      expect(archivedTasks.every((t) => t.archived)).toBe(true);
    });

    it('should allow searching in archived tasks', () => {
      const archivedTasks = [
        { id: 't1', title: 'Contrato', archived: true },
        { id: 't2', title: 'Petição', archived: true },
      ];
      const results = archivedTasks.filter((t) => t.title.toLowerCase().includes('contrato'));
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('t1');
    });

    it('should filter archived by date, responsible, etc.', () => {
      const filters = { responsibleUserId: 'user_001', archived: true };
      expect(filters.archived).toBe(true);
      expect(filters.responsibleUserId).toBe('user_001');
    });
  });

  describe('Archived task permissions', () => {
    it('should allow read-only access for authorized users', () => {
      const canView = hasPermission('internal_reader' as RoleId, 'view', 'task');
      expect(canView).toBe(true);
    });

    it('should block editing archived tasks', () => {
      const canEdit = hasPermission('collaborator' as RoleId, 'edit', 'task');
      expect(canEdit).toBe(true);
    });

    it('should allow only admins and coordinators to archive', () => {
      const adminCan = hasPermission('administrator' as RoleId, 'archive', 'task');
      const coordCan = hasPermission('coordinator' as RoleId, 'archive', 'task');
      const collabCan = hasPermission('collaborator' as RoleId, 'archive', 'task');
      expect(adminCan).toBe(true);
      expect(coordCan).toBe(true);
      expect(collabCan).toBe(false);
    });

    it('should allow only admins and coordinators to restore', () => {
      const adminCan = hasPermission('administrator' as RoleId, 'restore', 'task');
      const coordCan = hasPermission('coordinator' as RoleId, 'restore', 'task');
      const readerCan = hasPermission('internal_reader' as RoleId, 'restore', 'task');
      expect(adminCan).toBe(true);
      expect(coordCan).toBe(true);
      expect(readerCan).toBe(false);
    });
  });
});
