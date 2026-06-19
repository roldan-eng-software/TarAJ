import { adminDb } from '@/src/firebase/admin';
import type { StageAlertConfig, StageId, AlertEventType, Task, RoleId } from '@/src/types/domain';

export interface RecipientInfo {
  userId: string;
  reason: 'responsible' | 'creator' | 'participant' | 'role';
}

const STAGE_IDS: StageId[] = [
  'entrada', 'analise', 'aguardando_docs', 'andamento', 'revisao', 'concluida', 'arquivada',
];

const CONFIGURABLE_EVENT_TYPES: AlertEventType[] = [
  'task_created',
  'responsible_changed',
  'stage_changed',
  'stage_moved_backward',
  'due_upcoming',
  'due_overdue',
  'task_completed',
  'task_archived',
  'task_restored',
  'mentioned_in_comment',
];

function generateConfigId(stageId: StageId, eventType: AlertEventType): string {
  return `${stageId}_${eventType}`;
}

export function getConfigurableEvents(): AlertEventType[] {
  return CONFIGURABLE_EVENT_TYPES;
}

export function getConfigurableStages(): StageId[] {
  return STAGE_IDS;
}

export async function getAlertConfig(
  stageId: StageId,
  eventType: AlertEventType
): Promise<StageAlertConfig | null> {
  const configId = generateConfigId(stageId, eventType);
  const doc = await adminDb.collection('stageAlertConfig').doc(configId).get();

  if (!doc.exists) return null;

  return {
    id: doc.id,
    ...doc.data(),
    updatedAt: doc.data()?.updatedAt?.toDate(),
  } as StageAlertConfig;
}

export async function getAllAlertConfigs(): Promise<StageAlertConfig[]> {
  const snapshot = await adminDb
    .collection('stageAlertConfig')
    .orderBy('stageId', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as StageAlertConfig[];
}

export async function getAlertConfigsByStage(stageId: StageId): Promise<StageAlertConfig[]> {
  const snapshot = await adminDb
    .collection('stageAlertConfig')
    .where('stageId', '==', stageId)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as StageAlertConfig[];
}

export async function updateAlertConfig(
  configId: string,
  updates: Partial<Omit<StageAlertConfig, 'id' | 'stageId' | 'eventType'>> & { updatedBy: string }
): Promise<void> {
  await adminDb.collection('stageAlertConfig').doc(configId).update({
    ...updates,
    updatedAt: new Date(),
  });
}

export async function createDefaultAlertConfig(
  stageId: StageId,
  eventType: AlertEventType,
  createdBy: string
): Promise<StageAlertConfig> {
  const configId = generateConfigId(stageId, eventType);
  const now = new Date();

  const config: Omit<StageAlertConfig, 'id'> = {
    stageId,
    eventType,
    enabled: true,
    notifyResponsible: true,
    notifyCreator: false,
    notifyParticipants: false,
    notifyRoles: [],
    updatedAt: now,
    updatedBy: createdBy,
  };

  await adminDb.collection('stageAlertConfig').doc(configId).set(config);

  return { id: configId, ...config };
}

export async function seedDefaultAlertConfigs(createdBy: string): Promise<number> {
  let count = 0;

  for (const stageId of STAGE_IDS) {
    for (const eventType of CONFIGURABLE_EVENT_TYPES) {
      const configId = generateConfigId(stageId, eventType);
      const existing = await adminDb.collection('stageAlertConfig').doc(configId).get();
      if (existing.exists) continue;

      await createDefaultAlertConfig(stageId, eventType, createdBy);
      count++;
    }
  }

  return count;
}

export async function getRecipientsForEvent(
  stageId: StageId,
  eventType: AlertEventType,
  task: Task
): Promise<RecipientInfo[]> {
  const config = await getAlertConfig(stageId, eventType);

  if (!config || !config.enabled) return [];

  const recipients: RecipientInfo[] = [];
  const seen = new Set<string>();

  function add(userId: string, reason: RecipientInfo['reason']): void {
    if (!userId || seen.has(userId)) return;
    seen.add(userId);
    recipients.push({ userId, reason });
  }

  if (config.notifyResponsible && task.responsibleUserId) {
    add(task.responsibleUserId, 'responsible');
  }

  if (config.notifyCreator && task.createdBy) {
    add(task.createdBy, 'creator');
  }

  if (config.notifyParticipants) {
    for (const pid of task.participantIds || []) {
      add(pid, 'participant');
    }
  }

  if (config.notifyRoles.length > 0) {
    const roleUsers = await getUsersByRoles(config.notifyRoles);
    for (const uid of roleUsers) {
      add(uid, 'role');
    }
  }

  return recipients;
}

async function getUsersByRoles(roles: RoleId[]): Promise<string[]> {
  if (roles.length === 0) return [];

  const snapshot = await adminDb
    .collection('users')
    .where('roleId', 'in', roles)
    .where('status', '==', 'active')
    .get();

  return snapshot.docs.map((doc) => doc.id);
}
