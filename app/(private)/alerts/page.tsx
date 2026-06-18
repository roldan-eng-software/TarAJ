'use client';

import { useEffect, useState } from 'react';
import type { Alert } from '@/src/types/domain';

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];
}

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

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();

      const res = await fetch('/api/alerts?unread=false&limit=100', {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error('Failed to load alerts');

      const data: Alert[] = await res.json();
      setAlerts(data);
      setUnreadCount(data.filter((a) => !a.readAt).length);
    } catch (err) {
      setError('Falha ao carregar alertas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/alerts/${alertId}/read`, {
        method: 'POST',
        headers: token ? { authorization: `Bearer ${token}` } : {},
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
      const token = getToken();
      const res = await fetch('/api/alerts/mark-all-read', {
        method: 'PUT',
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error('Failed to mark all as read');

      setAlerts(alerts.map((a) => ({ ...a, readAt: new Date() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
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
            className="px-4 py-2 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            Marcar todos como lido
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum alerta ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${
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
                    className="ml-4 text-sm text-sky-600 hover:text-sky-700 font-medium"
                  >
                    Marcar como lido
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
