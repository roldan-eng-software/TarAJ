'use client';

import { useEffect, useState } from 'react';
import type { TaskHistory } from '@/src/types/domain';

interface TaskTimelineProps {
  taskId: string;
}

function getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    created: 'Tarefa criada',
    stage_changed: 'Estágio alterado',
    responsible_changed: 'Responsável alterado',
    comment_added: 'Comentário adicionado',
    attachment_added: 'Anexo adicionado',
    completed: 'Tarefa concluída',
    archived: 'Tarefa arquivada',
    restored: 'Tarefa restaurada',
    updated: 'Tarefa atualizada',
  };
  return labels[eventType] || eventType;
}

function getEventColor(eventType: string): string {
  if (eventType === 'created' || eventType === 'restored') return 'bg-green-500';
  if (eventType === 'archived') return 'bg-gray-500';
  if (eventType === 'completed') return 'bg-blue-500';
  if (eventType === 'comment_added' || eventType === 'attachment_added') return 'bg-sky-500';
  if (eventType === 'stage_changed' || eventType === 'responsible_changed') return 'bg-amber-500';
  return 'bg-sky-500';
}

export default function TaskTimeline({ taskId }: TaskTimelineProps) {
  const [events, setEvents] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        const res = await fetch(`/api/tasks/${taskId}`, {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error('Failed to load history');

        const task = await res.json();
        setEvents(task.history || []);
      } catch (err) {
        setError('Failed to load history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [taskId]);

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Carregando...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (events.length === 0) {
    return <div className="text-center py-4 text-gray-500">Nenhum histórico disponível</div>;
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id || index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${getEventColor(event.eventType)} mt-2`} />
            {index < events.length - 1 && <div className="w-0.5 h-8 bg-gray-300 mt-2" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{getEventLabel(event.eventType)}</p>
            <p className="text-xs text-gray-600 mt-1">
              {event.actor} - {event.occurredAt ? new Date(event.occurredAt).toLocaleString('pt-BR') : ''}
            </p>
            {typeof event.newValue === 'string' && (
              <p className="text-sm text-gray-700 mt-1">{event.newValue}</p>
            )}
            {event.metadata && typeof event.metadata === 'object' && (
              <p className="text-sm text-gray-700 mt-1">{JSON.stringify(event.metadata).substring(0, 120)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
