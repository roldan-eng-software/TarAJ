'use client';

import { EmailJobsStatus } from '@/components/admin/EmailJobsStatus';

export default function EmailJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jobs de Email</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fila de envio de emails do sistema.
        </p>
      </div>
      <EmailJobsStatus />
    </div>
  );
}
