'use client';

import { useEffect, useState, useMemo } from 'react';
import { LoadingState, EmptyState } from '@/components/ui/StateViews';
import Pagination from '@/components/ui/Pagination';
import type { Alert } from '@/src/types/domain';

const ITEMS_PER_PAGE = 15;

function getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    task_created: 'Tarefa criada',
    task_assigned: 'Tarefa atribuída',
    stage_changed: 'Estágio alterado',
    responsible_changed: 'Responsável alterado',
    mentioned: 'Menção em comentário',
    mentioned_in_comment: 'Menção em comentário',
    task_completed: 'Tarefa concluída',
    task_archived: 'Tarefa arquivada',
    backward_move: 'Retorno de estágio',
    stage_moved_backward: 'Retorno de estágio',
    due_upcoming: 'Prazo próximo',
    due_overdue: 'Prazo vencido',
    task_restored: 'Tarefa restaurada',
  };
  return labels[eventType] || eventType;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/alerts?unread=false&limit=200', {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to load alerts');

      const data: Alert[] = await res.json();
      setAlerts(data);
      setUnreadCount(data.filter((a) => !a.readAt).length);
      setPage(1);
    } catch (err) {
      setError('Falha ao carregar alertas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/read`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to mark as read');

      setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, readAt: new Date() } : a)));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to mark all as read');

      setAlerts(alerts.map((a) => ({ ...a, readAt: new Date() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(alerts.length / ITEMS_PER_PAGE));
  const paginatedAlerts = useMemo(
    () => alerts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [alerts, page]
  );

  if (loading) {
    return <LoadingState message="Carregando..." />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Alertas</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600 mt-1">
              {unreadCount} {unreadCount === 1 ? 'alerta não lido' : 'alertas não lidos'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm font-medium text-sky-600 hover:text-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 rounded"
          >
            Marcar todos como lido
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg" role="alert">{error}</div>}

      {alerts.length === 0 ? (
        <EmptyState message="Nenhum alerta ainda." />
      ) : (
        <>
          <div className="space-y-3" role="list">
            {paginatedAlerts.map((alert) => (
              <div
                key={alert.id}
                role="listitem"
                className={`p-4 rounded-lg border hover:shadow-sm transition ${
                  !alert.readAt
                    ? 'bg-sky-50 border-sky-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {alert.actorName} • {alert.createdAt ? new Date(alert.createdAt).toLocaleString('pt-BR') : ''}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-sky-100 text-sky-700 rounded">
                      {getEventLabel(alert.eventType)}
                    </span>
                  </div>
                  {!alert.readAt && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="ml-4 text-sm text-sky-600 hover:text-sky-700 font-medium focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
                    >
                      Marcar como lido
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
