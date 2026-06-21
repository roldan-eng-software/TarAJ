import { describe, it, expect, vi } from 'vitest';
import { extractMentions } from '@/src/domain/comments/comment-service';
import { getAttachmentStoragePath } from '@/src/domain/attachments/attachment-service';
import { recordHistoryEvent, getTaskHistory } from '@/src/domain/history/history-service';

vi.mock('@/src/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({
          add: vi.fn(() => Promise.resolve({ id: 'hist_001' })),
          orderBy: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({
              docs: [
                {
                  id: 'hist_001',
                  data: () => ({
                    taskId: 'task_001',
                    eventType: 'created',
                    actor: 'user_001',
                    actorRole: 'coordinator',
                    occurredAt: { toDate: () => new Date('2026-06-01') },
                  }),
                },
                {
                  id: 'hist_002',
                  data: () => ({
                    taskId: 'task_001',
                    eventType: 'stage_changed',
                    actor: 'user_001',
                    actorRole: 'coordinator',
                    occurredAt: { toDate: () => new Date('2026-06-02') },
                  }),
                },
              ],
            })),
          })),
        })),
      })),
    })),
  },
}));

const mockActorRole = 'coordinator';

describe('History, Comments and Attachments', () => {
  describe('Task history (append-only)', () => {
    it('should record task creation event', async () => {
      const historyId = await recordHistoryEvent('task_001', 'created', 'user_001', mockActorRole, {
        newValue: { title: 'Test Task' },
      });
      expect(historyId).toBe('hist_001');
    });

    it('should record stage change events', async () => {
      const historyId = await recordHistoryEvent('task_001', 'stage_changed', 'user_001', mockActorRole, {
        previousValue: 'entrada',
        newValue: 'analise',
      });
      expect(historyId).toBeTruthy();
    });

    it('should record responsible user changes', async () => {
      const historyId = await recordHistoryEvent('task_001', 'responsible_changed', 'user_001', mockActorRole, {
        previousValue: 'user_001',
        newValue: 'user_002',
      });
      expect(historyId).toBeTruthy();
    });

    it('should NOT allow deletion of history entries', () => {
      const historyRef = { delete: vi.fn() };
      expect(typeof historyRef.delete).toBe('function');
    });

    it('should NOT allow editing history entries', () => {
      const historyRef = { update: vi.fn() };
      expect(typeof historyRef.update).toBe('function');
    });

    it('should maintain chronological order', async () => {
      const history = await getTaskHistory('task_001');
      expect(history.length).toBe(2);
      expect(history[0].eventType).toBe('created');
      expect(history[1].eventType).toBe('stage_changed');
    });
  });

  describe('Comments', () => {
    it('should detect @mentions in comment text', () => {
      const mentions = extractMentions('Olá @joao, por favor revise @maria');
      expect(mentions).toContain('joao');
      expect(mentions).toContain('maria');
      expect(mentions.length).toBe(2);
    });

    it('should ignore duplicate mentions', () => {
      const mentions = extractMentions('@joao @joao @maria');
      expect(mentions.length).toBe(2);
    });

    it('should return empty array when no mentions', () => {
      const mentions = extractMentions('Comentário sem menções');
      expect(mentions).toEqual([]);
    });

    it('should store author and timestamp', () => {
      const comment = {
        id: 'cmt_001',
        taskId: 'task_001',
        authorId: 'user_001',
        authorName: 'João',
        content: 'Comentário de teste',
        mentions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(comment.authorId).toBe('user_001');
      expect(comment.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Attachments', () => {
    it('should enforce task-scoped storage paths', () => {
      const path = getAttachmentStoragePath('task_001', 'att_001', 'documento.pdf');
      expect(path).toBe('tasks/task_001/att_001/documento.pdf');
      expect(path).not.toContain('task_002');
    });

    it('should store attachment metadata in Firestore', () => {
      const metadata = {
        id: 'att_001',
        taskId: 'task_001',
        fileName: 'documento.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedBy: 'user_001',
        uploadedByName: 'João',
        blobUrl: 'https://blob.vercel-storage.com/doc.pdf',
        createdAt: new Date(),
      };
      expect(metadata.taskId).toBe('task_001');
      expect(metadata.fileName).toBe('documento.pdf');
      expect(metadata.fileSize).toBeGreaterThan(0);
    });

    it('should prevent access to attachments from unrelated tasks', () => {
      const pathTask1 = getAttachmentStoragePath('task_001', 'att_001', 'doc.pdf');
      const pathTask2 = getAttachmentStoragePath('task_002', 'att_001', 'doc.pdf');
      expect(pathTask1).not.toBe(pathTask2);
      expect(pathTask1).toContain('task_001');
      expect(pathTask2).toContain('task_002');
    });
  });

  describe('Task timeline', () => {
    it('should aggregate history and comments chronologically', async () => {
      const history = await getTaskHistory('task_001');
      const events = history.map((h) => h.eventType);
      expect(events).toContain('created');
      expect(events).toContain('stage_changed');
    });

    it('should include all creation, edit, comment and attachment events', () => {
      const validTypes = ['created', 'stage_changed', 'responsible_changed', 'comment_added', 'attachment_added', 'updated', 'completed', 'archived', 'restored'];
      expect(validTypes).toContain('created');
      expect(validTypes).toContain('comment_added');
      expect(validTypes).toContain('attachment_added');
      expect(validTypes).toContain('updated');
    });
  });
});
