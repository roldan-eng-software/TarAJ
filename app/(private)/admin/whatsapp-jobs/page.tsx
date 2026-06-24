'use client';

import { WhatsAppJobsStatus } from '@/components/admin/WhatsAppJobsStatus';

export default function WhatsAppJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jobs de WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fila de envio de mensagens WhatsApp do sistema.
        </p>
      </div>
      <WhatsAppJobsStatus />
    </div>
  );
}
