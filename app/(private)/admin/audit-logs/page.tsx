'use client';

import { AuditLogViewer } from '@/components/audit/AuditLogViewer';

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
        <p className="text-sm text-gray-500 mt-1">
          Logs de eventos críticos do sistema.
        </p>
      </div>
      <AuditLogViewer />
    </div>
  );
}
