import { adminDb } from '@/src/firebase/admin';

export interface InactivityConfig {
  daysThreshold: number;
  enabled: boolean;
  updatedAt: Date;
  updatedBy: string;
}

const CONFIG_docId = 'inactivity';

export async function getInactivityConfig(): Promise<InactivityConfig> {
  const doc = await adminDb.collection('systemSettings').doc(CONFIG_docId).get();

  if (!doc.exists) {
    return {
      daysThreshold: 7,
      enabled: true,
      updatedAt: new Date(),
      updatedBy: 'system',
    };
  }

  const data = doc.data()!;
  return {
    daysThreshold: data.daysThreshold ?? 7,
    enabled: data.enabled ?? true,
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    updatedBy: data.updatedBy ?? 'system',
  };
}

export async function updateInactivityConfig(
  daysThreshold: number,
  enabled: boolean,
  userId: string
): Promise<void> {
  await adminDb.collection('systemSettings').doc(CONFIG_docId).set({
    daysThreshold,
    enabled,
    updatedAt: new Date(),
    updatedBy: userId,
  });
}
