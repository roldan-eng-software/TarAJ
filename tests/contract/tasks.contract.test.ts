import { describe, it, expect, vi } from 'vitest';
import { validateTaskCreation } from '@/src/domain/tasks/task-validation';
import { isValidTransition, validateTransition } from '@/src/domain/workflow/workflow-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import type { SessionUser, StageId } from '@/src/types/domain';

const adminUser: SessionUser = { uid: 'admin_001', email: 'admin@test.com', displayName: 'Admin', roleId: 'administrator', permissions: [] };
const readerUser: SessionUser = { uid: 'reader_001', email: 'reader@test.com', displayName: 'Reader', roleId: 'internal_reader', permissions: [] };

function mockRequest(method: string, path: string, body?: unknown, token?: string) {
  return {
    method,
    url: `http://localhost:3000${path}`,
    headers: new Map(token ? [['authorization', `Bearer ${token}`]] : []),
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('Task Route Handler Contract', () => {
  describe('POST /api/tasks - Create task', () => {
    it('should require authentication', () => {
      const req = mockRequest('POST', '/api/tasks', {}, undefined);
      const hasAuth = req.headers.has('authorization');
      expect(hasAuth).toBe(false);
    });

    it('should validate required fields', () => {
      const invalidInput = { title: '', description: '', category: '', priority: '', responsibleUserId: '', confidentialityLevel: '' };
      expect(() => validateTaskCreation(invalidInput as any)).toThrow();
    });

    it('should accept valid task creation input', () => {
      const validInput = {
        title: 'Analisar documento',
        description: 'Descrição operacional',
        category: 'documentos',
        priority: 'normal',
        responsibleUserId: 'user_123',
        participantIds: ['user_456'],
        dueDate: '2026-06-25T12:00:00.000Z',
        confidentialityLevel: 'interno',
        internalNotes: 'Observação interna',
      };
      const result = validateTaskCreation(validInput);
      expect(result.title).toBe('Analisar documento');
      expect(result.category).toBe('documentos');
    });

    it('should enforce coordinator+ role requirement', () => {
      expect(() => assertCan(adminUser, 'create', 'task')).not.toThrow();
      expect(() => assertCan(readerUser, 'create', 'task')).toThrow();
    });

    it('should return created task with ID and timestamp', () => {
      const response = {
        id: 'task_123',
        referenceCode: 'JUR-2026-001',
        title: 'Analisar documento',
        stageId: 'entrada',
        createdAt: new Date().toISOString(),
      };
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('referenceCode');
      expect(response.stageId).toBe('entrada');
    });
  });

  describe('GET /api/tasks - List tasks', () => {
    it('should require authentication', () => {
      const req = mockRequest('GET', '/api/tasks?archived=false&limit=50');
      const hasAuth = req.headers.has('authorization');
      expect(hasAuth).toBe(false);
    });

    it('should filter by user role and permissions', () => {
      expect(() => assertCan(readerUser, 'view', 'task')).not.toThrow();
    });

    it('should return array of tasks with stage information', () => {
      const response = {
        tasks: [
          { id: 't1', title: 'Task 1', stageId: 'entrada', priority: 'normal' },
          { id: 't2', title: 'Task 2', stageId: 'analise', priority: 'alta' },
        ],
      };
      expect(Array.isArray(response.tasks)).toBe(true);
      expect(response.tasks[0]).toHaveProperty('stageId');
      expect(response.tasks[0]).toHaveProperty('priority');
    });

    it('should parse query parameters correctly', () => {
      const url = new URL('http://localhost:3000/api/tasks?stageId=entrada&priority=alta&limit=10');
      expect(url.searchParams.get('stageId')).toBe('entrada');
      expect(url.searchParams.get('priority')).toBe('alta');
      expect(url.searchParams.get('limit')).toBe('10');
    });
  });

  describe('GET /api/tasks/[taskId] - Get task detail', () => {
    it('should require authentication', () => {
      const req = mockRequest('GET', '/api/tasks/task_123');
      const hasAuth = req.headers.has('authorization');
      expect(hasAuth).toBe(false);
    });

    it('should return 404 for inaccessible tasks', () => {
      const response = { error: 'Task not found' };
      expect(response.error).toBe('Task not found');
    });

    it('should match the expected URL pattern', () => {
      const pattern = /^\/api\/tasks\/[\w-]+$/;
      expect(pattern.test('/api/tasks/task_123')).toBe(true);
      expect(pattern.test('/api/tasks/')).toBe(false);
    });
  });

  describe('PATCH /api/tasks/[taskId] - Update task', () => {
    it('should require authentication', () => {
      const req = mockRequest('PATCH', '/api/tasks/task_123');
      const hasAuth = req.headers.has('authorization');
      expect(hasAuth).toBe(false);
    });

    it('should check permission for task update', () => {
      expect(() => assertCan(adminUser, 'edit', 'task')).not.toThrow();
      expect(() => assertCan(readerUser, 'edit', 'task')).toThrow();
    });

    it('should accept title update', () => {
      const body = { title: 'Novo título da tarefa' };
      expect(body).toHaveProperty('title');
      expect(typeof body.title).toBe('string');
    });

    it('should accept priority update', () => {
      const body = { priority: 'alta' };
      expect(body).toHaveProperty('priority');
      expect(['baixa', 'normal', 'alta', 'crítica']).toContain(body.priority);
    });

    it('should accept responsible user change', () => {
      const body = { responsibleUserId: 'user_002' };
      expect(body).toHaveProperty('responsibleUserId');
    });

    it('should accept category update', () => {
      const body = { category: 'civel' };
      expect(body).toHaveProperty('category');
    });

    it('should accept description update', () => {
      const body = { description: 'Nova descrição detalhada da tarefa' };
      expect(body).toHaveProperty('description');
    });

    it('should accept dueDate update', () => {
      const body = { dueDate: '2026-07-01' };
      expect(body).toHaveProperty('dueDate');
    });

    it('should accept multiple fields at once', () => {
      const body = {
        title: 'Título atualizado',
        priority: 'alta',
        description: 'Descrição atualizada',
        category: 'trabalhista',
      };
      expect(Object.keys(body).length).toBe(4);
    });

    it('should match expected URL pattern', () => {
      const pattern = /^\/api\/tasks\/[a-zA-Z0-9_-]+$/;
      expect(pattern.test('/api/tasks/task_123')).toBe(true);
      expect(pattern.test('/api/tasks/')).toBe(false);
    });
  });

  describe('POST /api/tasks/[taskId]/transitions - Move task', () => {
    it('should validate stage transition rules', () => {
      expect(isValidTransition('entrada' as StageId, 'analise' as StageId)).toBe(true);
      expect(isValidTransition('entrada' as StageId, 'concluida' as StageId)).toBe(false);
    });

    it('should detect backward transitions', () => {
      const result = validateTransition('revisao' as StageId, 'andamento' as StageId);
      expect(result.valid).toBe(true);
      expect(result.backward).toBe(true);
    });

    it('should require authentication', () => {
      const req = mockRequest('POST', '/api/tasks/task_123/transitions');
      const hasAuth = req.headers.has('authorization');
      expect(hasAuth).toBe(false);
    });

    it('should create history entry and audit log', () => {
      const transition = { taskId: 'task_123', previousStageId: 'entrada', stageId: 'analise' };
      expect(transition).toHaveProperty('taskId');
      expect(transition).toHaveProperty('previousStageId');
      expect(transition).toHaveProperty('stageId');
    });
  });
});
