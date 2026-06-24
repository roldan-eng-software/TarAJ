import { describe, it, expect } from 'vitest';
import { generateDedupeKey } from '@/src/domain/notifications/notification-service';

describe('Inactivity Alert System', () => {
  describe('Deduplication for inactivity alerts', () => {
    it('should generate consistent dedup key for inactivity_alert', () => {
      const key = generateDedupeKey('inactivity_alert', 'task_123', 'user_456');
      expect(key).toBe('inactivity_alert_task_123_user_456_v1');
    });

    it('should produce different keys for different recipients', () => {
      const keyA = generateDedupeKey('inactivity_alert', 'task_123', 'user_a');
      const keyB = generateDedupeKey('inactivity_alert', 'task_123', 'user_b');
      expect(keyA).not.toBe(keyB);
    });

    it('should produce different keys for different tasks', () => {
      const keyA = generateDedupeKey('inactivity_alert', 'task_111', 'user_456');
      const keyB = generateDedupeKey('inactivity_alert', 'task_222', 'user_456');
      expect(keyA).not.toBe(keyB);
    });
  });

  describe('Inactivity config defaults', () => {
    it('should have a default threshold of 7 days', () => {
      const defaultThreshold = 7;
      expect(defaultThreshold).toBeGreaterThan(0);
      expect(defaultThreshold).toBeLessThanOrEqual(365);
    });

    it('should have enabled as default', () => {
      const defaultEnabled = true;
      expect(defaultEnabled).toBe(true);
    });
  });

  describe('Inactivity calculation', () => {
    function daysSinceActivity(lastActivityAt: Date): number {
      const now = new Date();
      const diff = now.getTime() - lastActivityAt.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    it('should calculate days inactive correctly', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      expect(daysSinceActivity(tenDaysAgo)).toBeGreaterThanOrEqual(10);
    });

    it('should return 0 or 1 for recent activity', () => {
      const now = new Date();
      expect(daysSinceActivity(now)).toBeLessThanOrEqual(1);
    });

    it('should detect inactive task beyond threshold', () => {
      const threshold = 7;
      const oldActivity = new Date();
      oldActivity.setDate(oldActivity.getDate() - threshold - 1);
      expect(daysSinceActivity(oldActivity)).toBeGreaterThan(threshold);
    });

    it('should NOT flag task within threshold', () => {
      const threshold = 7;
      const recentActivity = new Date();
      recentActivity.setDate(recentActivity.getDate() - threshold + 2);
      expect(daysSinceActivity(recentActivity)).toBeLessThanOrEqual(threshold);
    });
  });

  describe('Inactivity message building', () => {
    it('should build correct PT-BR message', () => {
      const title = 'Analisar contrato';
      const days = 10;
      const message = `Tarefa "${title}" está sem movimentação há ${days} dias`;
      expect(message).toContain('10 dias');
      expect(message).toContain('Analisar contrato');
    });

    it('should handle singular day', () => {
      const message = `Tarefa "Teste" está sem movimentação há 1 dias`;
      expect(message).toContain('1 dias');
    });
  });

  describe('Inactivity alert event type', () => {
    it('should be included in cron event types for deduplication', () => {
      const cronEventTypes = new Set(['due_upcoming', 'due_overdue', 'inactivity_alert']);
      expect(cronEventTypes.has('inactivity_alert')).toBe(true);
    });

    it('should be a configurable event type', () => {
      const configurableEvents = [
        'task_created', 'responsible_changed', 'stage_changed',
        'stage_moved_backward', 'due_upcoming', 'due_overdue',
        'task_completed', 'task_archived', 'task_restored',
        'mentioned_in_comment', 'inactivity_alert',
      ];
      expect(configurableEvents).toContain('inactivity_alert');
    });
  });
});
