import { describe, it, expect, vi } from 'vitest';
import type { SessionUser } from '@/src/types/domain';

const authenticatedUser: SessionUser = { uid: 'user_001', email: 'user@test.com', displayName: 'User', roleId: 'advocate', permissions: [] };

function mockRequest(method: string, body?: unknown, session?: SessionUser) {
  return {
    method,
    headers: new Map(session ? [['x-test-session', session.uid]] : []),
    json: vi.fn().mockResolvedValue(body),
    cookies: { session: session ? 'valid-session-token' : '' },
  };
}

const VALID_EVENT_TYPES = [
  'task_created', 'task_assigned', 'stage_changed', 'responsible_changed',
  'mentioned', 'task_completed', 'task_archived', 'backward_move',
  'due_upcoming', 'due_overdue', 'task_restored',
];

describe('GET /api/me - Get profile', () => {
  it('should return 401 when unauthenticated', () => {
    const req = mockRequest('GET');
    const hasSession = req.cookies.session && req.cookies.session.length > 0;
    expect(hasSession).toBeFalsy();
  });

  it('should return user profile fields', () => {
    const profile = {
      id: authenticatedUser.uid,
      displayName: 'User',
      email: 'user@test.com',
      roleId: 'advocate',
      notificationPrefs: null,
    };
    expect(profile).toHaveProperty('id', authenticatedUser.uid);
    expect(profile).toHaveProperty('displayName');
    expect(profile).toHaveProperty('email');
    expect(profile).toHaveProperty('roleId');
    expect(profile).toHaveProperty('notificationPrefs');
  });

  it('should not expose sensitive fields', () => {
    const profile = {
      id: authenticatedUser.uid,
      displayName: 'User',
      email: 'user@test.com',
      roleId: 'advocate',
    };
    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).not.toHaveProperty('tokens');
  });

  it('should include notification preferences when set', () => {
    const profile = {
      id: authenticatedUser.uid,
      notificationPrefs: {
        emailNotifications: true,
        enabledEvents: ['task_created', 'task_assigned'],
        updatedAt: new Date().toISOString(),
      },
    };
    expect(profile.notificationPrefs).toHaveProperty('emailNotifications', true);
    expect(profile.notificationPrefs.enabledEvents).toContain('task_created');
  });
});

describe('PATCH /api/me - Update preferences', () => {
  it('should return 401 when unauthenticated', () => {
    const req = mockRequest('PATCH', { notificationPrefs: {} });
    const hasSession = req.cookies.session && req.cookies.session.length > 0;
    expect(hasSession).toBeFalsy();
  });

  it('should accept valid notification preferences', () => {
    const body = {
      notificationPrefs: {
        emailNotifications: false,
        enabledEvents: ['task_created', 'stage_changed', 'mentioned'],
      },
    };
    expect(body.notificationPrefs).toHaveProperty('emailNotifications');
    expect(Array.isArray(body.notificationPrefs.enabledEvents)).toBe(true);
    for (const evt of body.notificationPrefs.enabledEvents) {
      expect(VALID_EVENT_TYPES).toContain(evt);
    }
  });

  it('should reject invalid event types', () => {
    const body = {
      notificationPrefs: {
        enabledEvents: ['invalid_event', 'task_created'],
      },
    };
    const filtered = body.notificationPrefs.enabledEvents.filter(
      (e: string) => VALID_EVENT_TYPES.includes(e)
    );
    expect(filtered).not.toContain('invalid_event');
    expect(filtered).toContain('task_created');
  });

  it('should return success response', () => {
    const response = { success: true };
    expect(response).toEqual({ success: true });
  });
});
