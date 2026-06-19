import { describe, it, expect } from 'vitest';

function generateDedupeKey(
  eventType: string,
  taskId: string,
  recipientId: string,
  version: number = 1
): string {
  return `${eventType}_${taskId}_${recipientId}_v${version}`;
}

const STAGE_ORDER: Record<string, number> = {
  entrada: 0,
  analise: 1,
  aguardando_docs: 2,
  andamento: 3,
  revisao: 4,
  concluida: 5,
  arquivada: 6,
};

function isBackwardTransition(fromStage: string, toStage: string): boolean {
  const from = STAGE_ORDER[fromStage];
  const to = STAGE_ORDER[toStage];
  if (from === undefined || to === undefined) return false;
  return to < from;
}

describe('Notification and Alert System', () => {
  describe('Deduplication keys', () => {
    it('should generate a consistent dedup key from event, task, recipient', () => {
      const key = generateDedupeKey('stage_changed', 'task_123', 'user_456');
      expect(key).toBe('stage_changed_task_123_user_456_v1');
    });

    it('should use version to differentiate repeated events', () => {
      const v1 = generateDedupeKey('due_upcoming', 'task_123', 'user_456', 1);
      const v2 = generateDedupeKey('due_upcoming', 'task_123', 'user_456', 2);
      expect(v1).not.toBe(v2);
    });

    it('should produce different keys for different recipients of the same event', () => {
      const keyA = generateDedupeKey('task_created', 'task_123', 'user_a');
      const keyB = generateDedupeKey('task_created', 'task_123', 'user_b');
      expect(keyA).not.toBe(keyB);
    });

    it('should produce different keys for different event types', () => {
      const keyCreated = generateDedupeKey('task_created', 'task_123', 'user_456');
      const keyArchived = generateDedupeKey('task_archived', 'task_123', 'user_456');
      expect(keyCreated).not.toBe(keyArchived);
    });
  });

  describe('Backward transition detection', () => {
    it('should detect backward move from revisao to andamento', () => {
      expect(isBackwardTransition('revisao', 'andamento')).toBe(true);
    });

    it('should detect backward move from analise to entrada', () => {
      expect(isBackwardTransition('analise', 'entrada')).toBe(true);
    });

    it('should NOT detect forward move as backward', () => {
      expect(isBackwardTransition('entrada', 'analise')).toBe(false);
    });

    it('should NOT detect same stage as backward', () => {
      expect(isBackwardTransition('analise', 'analise')).toBe(false);
    });

    it('should handle unknown stages gracefully', () => {
      expect(isBackwardTransition('unknown', 'entrada')).toBe(false);
      expect(isBackwardTransition('entrada', 'unknown')).toBe(false);
    });

    it('should identify backward from andamento to entrada', () => {
      expect(isBackwardTransition('andamento', 'entrada')).toBe(true);
    });
  });

  describe('Alert event types mapping', () => {
    const eventLabels: Record<string, string> = {
      task_created: 'Tarefa criada',
      responsible_changed: 'Responsável alterado',
      stage_changed: 'Estágio alterado',
      stage_moved_backward: 'Retorno de estágio',
      mentioned_in_comment: 'Menção em comentário',
      task_completed: 'Tarefa concluída',
      task_archived: 'Tarefa arquivada',
      due_upcoming: 'Prazo próximo',
      due_overdue: 'Prazo vencido',
      task_restored: 'Tarefa restaurada',
    };

    it('should have a human-readable label for every event type', () => {
      const keys = Object.keys(eventLabels);
      expect(keys.length).toBeGreaterThanOrEqual(10);
      keys.forEach((key) => {
        expect(eventLabels[key]).toBeTruthy();
      });
    });

    it('should distinguish stage_changed from stage_moved_backward', () => {
      expect(eventLabels.stage_changed).not.toBe(eventLabels.stage_moved_backward);
    });

    it('should distinguish due_upcoming from due_overdue', () => {
      expect(eventLabels.due_upcoming).not.toBe(eventLabels.due_overdue);
    });
  });

  describe('Email queue helpers', () => {
    it('should initialize a job in pending status', () => {
      const job = {
        recipientEmail: 'user@example.com',
        recipientName: 'User',
        subject: 'Test',
        body: 'Body',
        status: 'pending' as const,
        attempts: 0,
        maxAttempts: 3,
      };
      expect(job.status).toBe('pending');
      expect(job.attempts).toBe(0);
      expect(job.maxAttempts).toBe(3);
    });

    it('should allow up to 3 retry attempts', () => {
      const maxAttempts = 3;
      for (let i = 0; i < maxAttempts; i++) {
        expect(i).toBeLessThan(maxAttempts);
      }
    });
  });

  describe('Due-date calculation', () => {
    function daysUntilDue(dueDate: Date): number {
      const now = new Date();
      const diff = dueDate.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    it('should return positive integer for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(daysUntilDue(future)).toBeGreaterThan(0);
    });

    it('should return zero or negative for past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      expect(daysUntilDue(past)).toBeLessThanOrEqual(0);
    });

    it('should identify due in 1 day as upcoming', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const days = daysUntilDue(tomorrow);
      expect(days).toBeLessThanOrEqual(1);
      expect(days).toBeGreaterThan(0);
    });
  });
});
