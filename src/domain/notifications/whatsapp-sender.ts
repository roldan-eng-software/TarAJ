import { queueWhatsAppMessage } from '@/src/domain/notifications/whatsapp-queue-service';
import { getWhatsAppConfig } from '@/src/domain/notifications/whatsapp-config';

export interface SendWhatsAppInput {
  phone: string;
  message: string;
}

export async function sendWhatsAppMessage(input: SendWhatsAppInput): Promise<void> {
  const config = await getWhatsAppConfig();

  if (!config.enabled || !config.apiUrl) {
    throw new Error('WhatsApp is not configured or disabled');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(`${config.apiUrl}/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phone: input.phone,
      message: input.message,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`WhatsApp API error (${response.status}): ${errorText}`);
  }
}

export async function sendWhatsAppNotification(
  userId: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const config = await getWhatsAppConfig();
  if (!config.enabled) return false;

  try {
    const { adminDb } = await import('@/src/firebase/admin');
    const doc = await adminDb.collection('users').doc(userId).get();
    if (!doc.exists) return false;

    const userData = doc.data();
    const phone = userData?.phone;
    if (!phone) return false;

    await sendWhatsAppMessage({ phone, message });
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[sendWhatsApp] Error for user ${userId}: ${errorMessage}`);

    try {
      const { adminDb } = await import('@/src/firebase/admin');
      const doc = await adminDb.collection('users').doc(userId).get();
      const userData = doc.data();
      const phone = userData?.phone || '';
      const displayName = userData?.displayName || '';

      if (phone) {
        await queueWhatsAppMessage(phone, displayName, message, {
          ...metadata,
          userId,
          whatsappError: errorMessage,
        });
      }
    } catch {
      // Silent fail on queue fallback
    }

    return false;
  }
}
