'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuditLog } from '@/src/types/domain';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateViews';

type FilterType = 'all' | 'auth' | 'user' | 'role' | 'task' | 'comment' | 'attachment' | 'alert' | 'archive' | 'workflow';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'auth', label: 'Autenticação' },
  { value: 'user', label: 'Usuários' },
  { value: 'task', label: 'Tarefas' },
  { value: 'comment', label: 'Comentários' },
  { value: 'attachment', label: 'Anexos' },
  { value: 'archive', label: 'Arquivo' },
  { value: 'workflow', label: 'Workflow' },
];

const RESULT_COLORS: Record<string, string> = {
  success: 'text-green-700 bg-green-50 border-green-200',
  denied: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  failed: 'text-red-700 bg-red-50 border-red-200',
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter !== 'all' ? `?resourceType=${filter}` : '';
      const res = await fetch(`/api/admin/audit-logs${params}`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError('Erro ao carregar logs de auditoria.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const formatActor = (log: AuditLog) => {
    if (log.actor === log.actorRole) return log.actorRole;
    return `${log.actor} (${log.actorRole})`;
  };

  if (loading) return <LoadingState message="Carregando logs..." />;
  if (error) return <ErrorState message={error} onRetry={fetchLogs} />;
  if (logs.length === 0) return <EmptyState message="Nenhum log de auditoria encontrado." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
              filter === opt.value
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500 uppercase text-xs">
              <th className="pb-2 pr-4">Data/Hora</th>
              <th className="pb-2 pr-4">Usuário</th>
              <th className="pb-2 pr-4">Ação</th>
              <th className="pb-2 pr-4">Recurso</th>
              <th className="pb-2 pr-4">ID</th>
              <th className="pb-2 pr-2">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 whitespace-nowrap text-gray-600">
                  {formatDate(log.occurredAt)}
                </td>
                <td className="py-2 pr-4 text-gray-900">{formatActor(log)}</td>
                <td className="py-2 pr-4">
                  <span className="capitalize">{log.action}</span>
                </td>
                <td className="py-2 pr-4 text-gray-600">{log.resourceType}</td>
                <td className="py-2 pr-4 font-mono text-xs text-gray-500 max-w-[120px] truncate">
                  {log.resourceId}
                </td>
                <td className="py-2 pr-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${RESULT_COLORS[log.result] || 'text-gray-600 bg-gray-50'}`}>
                    {log.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-3 space-y-1">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500">{formatDate(log.occurredAt)}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${RESULT_COLORS[log.result] || 'text-gray-600 bg-gray-50'}`}>
                {log.result}
              </span>
            </div>
            <p className="text-sm text-gray-900">
              <span className="font-medium">{formatActor(log)}</span>
              {' '}realizou{' '}
              <span className="capitalize font-medium">{log.action}</span>
              {' '}em{' '}
              <span className="text-gray-600">{log.resourceType}</span>
            </p>
            {log.resourceId && (
              <p className="text-xs font-mono text-gray-400 truncate">{log.resourceId}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
