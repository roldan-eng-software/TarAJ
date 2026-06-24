import { adminDb } from '@/src/firebase/admin';
import type { WhatsAppConfig } from '@/src/types/domain';

const CONFIG_DOC_ID = 'whatsapp';

export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const doc = await adminDb.collection('systemSettings').doc(CONFIG_DOC_ID).get();

  if (!doc.exists) {
    return {
      enabled: false,
      apiUrl: '',
      apiKey: undefined,
      updatedAt: new Date(),
      updatedBy: 'system',
    };
  }

  const data = doc.data()!;
  return {
    enabled: data.enabled ?? false,
    apiUrl: data.apiUrl ?? '',
    apiKey: data.apiKey,
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    updatedBy: data.updatedBy ?? 'system',
  };
}

export async function updateWhatsAppConfig(
  enabled: boolean,
  apiUrl: string,
  apiKey: string | undefined,
  userId: string
): Promise<void> {
  await adminDb.collection('systemSettings').doc(CONFIG_DOC_ID).set({
    enabled,
    apiUrl,
    apiKey: apiKey || null,
    updatedAt: new Date(),
    updatedBy: userId,
  });
}
