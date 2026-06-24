'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { LoadingState, EmptyState } from '@/components/ui/StateViews';
import Pagination from '@/components/ui/Pagination';
import type { WhatsAppJob } from '@/src/types/domain';

const ITEMS_PER_PAGE = 20;

type StatusFilter = 'pending' | 'sent' | 'failed' | 'all';

const TABS: { label: string; value: StatusFilter }[] = [
  { label: 'Pendentes', value: 'pending' },
  { label: 'Enviados', value: 'sent' },
  { label: 'Falhos', value: 'failed' },
  { label: 'Todos', value: 'all' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function WhatsAppJobsStatus() {
  const [jobs, setJobs] = useState<WhatsAppJob[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>('pending');

  const fetchJobs = useCallback(async (statusFilter: StatusFilter) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/whatsapp-jobs?limit=200&status=${statusFilter}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to fetch WhatsApp jobs');

      const data = await res.json();
      setJobs(data.jobs || []);
      setTotalPending(data.totalPending || 0);
      setPage(1);
    } catch (err) {
      setError('Falha ao carregar jobs de WhatsApp');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(filter);
  }, [filter, fetchJobs]);

  const handleProcessNow = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/whatsapp-jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'process' }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to process WhatsApp messages');

      await fetchJobs(filter);
    } catch (err) {
      setError('Falha ao processar mensagens WhatsApp');
      console.error(err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(jobs.length / ITEMS_PER_PAGE));
  const paginatedJobs = useMemo(
    () => jobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [jobs, page]
  );

  if (loading) {
    return <LoadingState message="Carregando jobs de WhatsApp..." />;
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition cursor-pointer ${
                filter === tab.value
                  ? 'bg-sky-100 text-sky-800 border border-sky-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {totalPending > 0 && (
            <span className="text-sm text-gray-600">
              {totalPending} pendente{totalPending > 1 ? 's' : ''}
            </span>
          )}
          {filter === 'pending' && (
            <button
              onClick={handleProcessNow}
              className="px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition cursor-pointer"
            >
              Processar agora
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {jobs.length === 0 ? (
        <EmptyState message="Nenhum job de WhatsApp encontrado." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Destinatário</th>
                  <th className="text-left px-4 py-3 font-medium">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium">Mensagem</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Tentativas</th>
                  <th className="text-left px-4 py-3 font-medium">Criado em</th>
                  <th className="text-left px-4 py-3 font-medium">Enviado em</th>
                  <th className="text-left px-4 py-3 font-medium">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {job.recipientName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {job.recipientPhone}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                      {job.message}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                          statusColors[job.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {job.attempts}/{job.maxAttempts}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {job.sentAt ? new Date(job.sentAt).toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                      {job.error || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
