import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSendFn, mockConfigFn } = vi.hoisted(() => ({
  mockSendFn: vi.fn(),
  mockConfigFn: vi.fn(),
}));

vi.mock('@/src/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
  FieldValue: {
    increment: vi.fn((n: number) => ({ _increment: n })),
  },
}));

vi.mock('@/src/domain/notifications/whatsapp-config', () => ({
  getWhatsAppConfig: mockConfigFn,
  updateWhatsAppConfig: vi.fn(),
}));

vi.mock('@/src/domain/notifications/whatsapp-sender', () => ({
  sendWhatsAppMessage: mockSendFn,
  sendWhatsAppNotification: vi.fn(),
}));

import {
  queueWhatsAppMessage,
  getPendingWhatsAppMessages,
  updateWhatsAppJobStatus,
  processPendingWhatsAppMessages,
  cleanupOldWhatsAppJobs,
  countPendingWhatsAppMessages,
} from '@/src/domain/notifications/whatsapp-queue-service';
import { sendWhatsAppMessage } from '@/src/domain/notifications/whatsapp-sender';
import { adminDb } from '@/src/firebase/admin';

describe('WhatsApp Queue Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('queueWhatsAppMessage', () => {
    it('should create a pending WhatsApp job', async () => {
      const mockAdd = vi.fn().mockResolvedValue({ id: 'job-123' });
      vi.mocked(adminDb.collection).mockReturnValue({
        add: mockAdd,
      } as any);

      const job = await queueWhatsAppMessage(
        '+5511999999999',
        'João Silva',
        'Test message',
        { taskId: 'task-1' }
      );

      expect(job.id).toBe('job-123');
      expect(job.recipientPhone).toBe('+5511999999999');
      expect(job.recipientName).toBe('João Silva');
      expect(job.message).toBe('Test message');
      expect(job.status).toBe('pending');
      expect(job.attempts).toBe(0);
      expect(job.maxAttempts).toBe(3);
      expect(job.sentAt).toBeNull();
      expect(job.error).toBeNull();
      expect(mockAdd).toHaveBeenCalledOnce();
    });
  });

  describe('getPendingWhatsAppMessages', () => {
    it('should return pending jobs sorted by creation date', async () => {
      const mockDocs = [
        {
          id: 'job-1',
          data: () => ({
            recipientPhone: '+5511999999999',
            recipientName: 'João',
            message: 'Msg 1',
            status: 'pending',
            attempts: 0,
            maxAttempts: 3,
            createdAt: { toDate: () => new Date('2026-06-20') },
            sentAt: null,
            error: null,
          }),
        },
        {
          id: 'job-2',
          data: () => ({
            recipientPhone: '+5511888888888',
            recipientName: 'Maria',
            message: 'Msg 2',
            status: 'pending',
            attempts: 1,
            maxAttempts: 3,
            createdAt: { toDate: () => new Date('2026-06-21') },
            sentAt: null,
            error: null,
          }),
        },
      ];

      const mockGet = vi.fn().mockResolvedValue({ docs: mockDocs });
      vi.mocked(adminDb.collection).mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet,
        }),
      } as any);

      const jobs = await getPendingWhatsAppMessages(10);

      expect(jobs).toHaveLength(2);
      expect(jobs[0].id).toBe('job-1');
      expect(jobs[1].id).toBe('job-2');
    });

    it('should skip jobs with max attempts reached', async () => {
      const mockDocs = [
        {
          id: 'job-1',
          data: () => ({
            recipientPhone: '+5511999999999',
            recipientName: 'João',
            message: 'Msg 1',
            status: 'pending',
            attempts: 3,
            maxAttempts: 3,
            createdAt: { toDate: () => new Date('2026-06-20') },
            sentAt: null,
            error: null,
          }),
        },
      ];

      const mockGet = vi.fn().mockResolvedValue({ docs: mockDocs });
      vi.mocked(adminDb.collection).mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet,
        }),
      } as any);

      const jobs = await getPendingWhatsAppMessages(10);

      expect(jobs).toHaveLength(0);
    });
  });

  describe('updateWhatsAppJobStatus', () => {
    it('should update job status to sent', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      } as any);

      await updateWhatsAppJobStatus('job-123', 'sent');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'sent',
        })
      );
    });

    it('should update job status to failed with error', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      } as any);

      await updateWhatsAppJobStatus('job-123', 'failed', 'Connection timeout');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error: 'Connection timeout',
        })
      );
    });
  });

  describe('processPendingWhatsAppMessages', () => {
    it('should process pending jobs and return count', async () => {
      mockConfigFn.mockResolvedValue({
        enabled: true,
        apiUrl: 'http://localhost:3001',
        updatedAt: new Date(),
        updatedBy: 'system',
      });

      mockSendFn.mockResolvedValue(undefined);

      const mockDocs = [
        {
          id: 'job-1',
          data: () => ({
            recipientPhone: '+5511999999999',
            recipientName: 'João',
            message: 'Test message',
            status: 'pending',
            attempts: 0,
            maxAttempts: 3,
            createdAt: { toDate: () => new Date() },
            sentAt: null,
            error: null,
          }),
        },
      ];

      const mockGet = vi.fn().mockResolvedValue({ docs: mockDocs });
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      vi.mocked(adminDb.collection).mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet,
        }),
        doc: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      } as any);

      const processed = await processPendingWhatsAppMessages(10);

      expect(processed).toBe(1);
      expect(mockSendFn).toHaveBeenCalledWith({
        phone: '+5511999999999',
        message: 'Test message',
      });
    });

    it('should handle send failures gracefully', async () => {
      mockConfigFn.mockResolvedValue({
        enabled: true,
        apiUrl: 'http://localhost:3001',
        updatedAt: new Date(),
        updatedBy: 'system',
      });

      mockSendFn.mockRejectedValue(new Error('Connection refused'));

      const mockDocs = [
        {
          id: 'job-1',
          data: () => ({
            recipientPhone: '+5511999999999',
            recipientName: 'João',
            message: 'Test message',
            status: 'pending',
            attempts: 0,
            maxAttempts: 3,
            createdAt: { toDate: () => new Date() },
            sentAt: null,
            error: null,
          }),
        },
      ];

      const mockGet = vi.fn().mockResolvedValue({ docs: mockDocs });
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      vi.mocked(adminDb.collection).mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet,
        }),
        doc: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      } as any);

      const processed = await processPendingWhatsAppMessages(10);

      expect(processed).toBe(0);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error: 'Connection refused',
        })
      );
    });
  });

  describe('cleanupOldWhatsAppJobs', () => {
    it('should delete old sent jobs', async () => {
      const mockBatch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };

      const mockDoc1 = { ref: 'ref-1' };
      const mockDoc2 = { ref: 'ref-2' };
      const docs = [mockDoc1, mockDoc2];
      const mockGet = vi.fn().mockResolvedValue({
        docs,
        size: 2,
        forEach: (cb: (doc: any) => void) => docs.forEach(cb),
      });
      const mockLimit = vi.fn().mockReturnValue({ get: mockGet });
      const mockWhere2 = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere1 = vi.fn().mockReturnValue({ where: mockWhere2 });

      vi.mocked(adminDb.collection).mockReturnValue({
        where: mockWhere1,
      } as any);

      vi.mocked(adminDb).batch = vi.fn().mockReturnValue(mockBatch as any);

      const cleaned = await cleanupOldWhatsAppJobs(30);

      expect(cleaned).toBe(2);
      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalledOnce();
    });
  });

  describe('countPendingWhatsAppMessages', () => {
    it('should count pending messages', async () => {
      const mockDocs = [
        { data: () => ({ attempts: 0 }) },
        { data: () => ({ attempts: 1 }) },
        { data: () => ({ attempts: 3 }) },
      ];

      const mockGet = vi.fn().mockResolvedValue({ docs: mockDocs });
      vi.mocked(adminDb.collection).mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet,
        }),
      } as any);

      const count = await countPendingWhatsAppMessages();

      expect(count).toBe(2);
    });
  });
});

describe('WhatsApp Sender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendWhatsAppMessage', () => {
    it('should throw if WhatsApp is not configured', async () => {
      mockConfigFn.mockResolvedValue({
        enabled: false,
        apiUrl: '',
        updatedAt: new Date(),
        updatedBy: 'system',
      });

      mockSendFn.mockRejectedValue(new Error('WhatsApp is not configured or disabled'));

      await expect(
        sendWhatsAppMessage({ phone: '+5511999999999', message: 'Test' })
      ).rejects.toThrow('WhatsApp is not configured or disabled');
    });

    it('should throw if API URL is empty', async () => {
      mockConfigFn.mockResolvedValue({
        enabled: true,
        apiUrl: '',
        updatedAt: new Date(),
        updatedBy: 'system',
      });

      mockSendFn.mockRejectedValue(new Error('WhatsApp is not configured or disabled'));

      await expect(
        sendWhatsAppMessage({ phone: '+5511999999999', message: 'Test' })
      ).rejects.toThrow('WhatsApp is not configured or disabled');
    });
  });
});
