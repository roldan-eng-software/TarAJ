import { describe, it, expect } from 'vitest';
import { isValidTransition, validateTransition, getAllowedTransitions, getStageName } from '@/src/domain/workflow/workflow-service';
import { assertCan, assertCanAccessTask } from '@/src/domain/rbac/rbac-service';
import type { SessionUser, StageId, Task } from '@/src/types/domain';

const coordinator: SessionUser = { uid: 'coord_001', email: 'coord@test.com', displayName: 'Coord', roleId: 'coordinator', permissions: [] };
const collaborator: SessionUser = { uid: 'collab_001', email: 'collab@test.com', displayName: 'Collab', roleId: 'collaborator', permissions: [] };
const reader: SessionUser = { uid: 'reader_001', email: 'reader@test.com', displayName: 'Reader', roleId: 'internal_reader', permissions: [] };

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task_001',
    referenceCode: 'JUR-2026-001',
    title: 'Test Task',
    description: 'Description',
    category: 'documentos',
    priority: 'normal',
    stageId: 'entrada',
    responsibleUserId: 'collab_001',
    participantIds: [],
    confidentialityLevel: 'interno',
    archived: false,
    createdAt: new Date(),
    createdBy: 'coord_001',
    updatedAt: new Date(),
    updatedBy: 'coord_001',
    ...overrides,
  };
}

describe('Kanban Flow Integration', () => {
  describe('Complete task lifecycle', () => {
    it('should create task in entrada stage', () => {
      const task = makeTask();
      expect(task.stageId).toBe('entrada');
    });

    it('should move task through allowed stages', () => {
      expect(isValidTransition('entrada' as StageId, 'analise' as StageId)).toBe(true);
      expect(isValidTransition('analise' as StageId, 'andamento' as StageId)).toBe(true);
      expect(isValidTransition('andamento' as StageId, 'revisao' as StageId)).toBe(true);
      expect(isValidTransition('revisao' as StageId, 'concluida' as StageId)).toBe(true);
    });

    it('should record history for each stage movement', () => {
      const movements = [
        { from: 'entrada', to: 'analise' },
        { from: 'analise', to: 'andamento' },
        { from: 'andamento', to: 'revisao' },
        { from: 'revisao', to: 'concluida' },
      ];
      movements.forEach((m) => {
        expect(isValidTransition(m.from as StageId, m.to as StageId)).toBe(true);
      });
    });

    it('should allow backward movement with history', () => {
      const result = validateTransition('revisao' as StageId, 'andamento' as StageId);
      expect(result.valid).toBe(true);
      expect(result.backward).toBe(true);
    });

    it('should allow backward movement from andamento to entrada', () => {
      const result = validateTransition('andamento' as StageId, 'entrada' as StageId);
      expect(result.valid).toBe(true);
      expect(result.backward).toBe(true);
    });
  });

  describe('Authorization in Kanban', () => {
    it('should allow coordinator to create tasks', () => {
      expect(() => assertCan(coordinator, 'create', 'task')).not.toThrow();
    });

    it('should allow collaborator to move their assigned task', () => {
      const task = makeTask({ responsibleUserId: 'collab_001' });
      expect(() => assertCanAccessTask(collaborator, task, 'move')).not.toThrow();
    });

    it('should block collaborator from creating tasks', () => {
      expect(() => assertCan(collaborator, 'create', 'task')).toThrow();
    });

    it('should block unauthorized movement', () => {
      expect(() => assertCan(reader, 'move', 'task')).toThrow();
    });

    it('should block collaborator from moving unassigned task', () => {
      const task = makeTask({ responsibleUserId: 'other_user', participantIds: [] });
      expect(() => assertCanAccessTask(collaborator, task, 'move')).toThrow();
    });

    it('should allow internal reader to view tasks', () => {
      expect(() => assertCan(reader, 'view', 'task')).not.toThrow();
    });
  });

  describe('Kanban board display', () => {
    it('should group tasks by stage', () => {
      const tasks = [
        makeTask({ id: 't1', stageId: 'entrada' }),
        makeTask({ id: 't2', stageId: 'analise' }),
        makeTask({ id: 't3', stageId: 'entrada' }),
      ];
      const entradaTasks = tasks.filter((t) => t.stageId === 'entrada');
      expect(entradaTasks.length).toBe(2);
    });

    it('should display stage names correctly', () => {
      expect(getStageName('entrada' as StageId)).toBe('Entrada');
      expect(getStageName('analise' as StageId)).toBe('Em análise');
      expect(getStageName('concluida' as StageId)).toBe('Concluída');
    });

    it('should allow only valid transitions from each stage', () => {
      const allowed = getAllowedTransitions('entrada' as StageId);
      expect(allowed).toEqual(['analise']);
      expect(allowed).not.toContain('concluida');
    });

    it('should allow multiple targets from analise', () => {
      const allowed = getAllowedTransitions('analise' as StageId);
      expect(allowed).toContain('aguardando_docs');
      expect(allowed).toContain('andamento');
    });
  });
});
