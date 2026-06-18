'use client';

import { useEffect, useState } from 'react';
import type { TaskHistory } from '@/src/types/domain';

interface TaskTimelineProps {
  taskId: string;
}

const STAGE_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  analise: 'Em análise',
  aguardando_docs: 'Aguardando documentos',
  andamento: 'Em andamento',
  revisao: 'Em revisão',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
};

const PRIORITY_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  crítica: 'Crítica',
  critica: 'Crítica',
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  category: 'Categoria',
  priority: 'Prioridade',
  dueDate: 'Prazo',
  confidentialityLevel: 'Nível de Confidencialidade',
  internalNotes: 'Observações Internas',
  responsibleUserId: 'Responsável',
};

function formatValue(field: string, value: any, usersMap: Record<string, string>): string {
  if (value === null || value === undefined) return 'vazio';
  if (field === 'stageId' || field === 'previousStage' || field === 'targetStage') {
    return STAGE_LABELS[String(value)] || String(value);
  }
  if (field === 'priority') {
    return PRIORITY_LABELS[String(value)] || String(value);
  }
  if (field === 'responsibleUserId') {
    return usersMap[String(value)] || String(value);
  }
  if (field === 'dueDate' || field === 'dueAt') {
    try {
      return new Date(value).toLocaleDateString('pt-BR');
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// Custom icons based on event type
function EventIcon({ eventType }: { eventType: string }) {
  switch (eventType) {
    case 'created':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 ring-8 ring-white">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      );
    case 'completed':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 ring-8 ring-white">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    case 'archived':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </span>
      );
    case 'restored':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 ring-8 ring-white">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
          </svg>
        </span>
      );
    case 'comment_added':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 ring-8 ring-white">
          <svg className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </span>
      );
    case 'attachment_added':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 ring-8 ring-white">
          <svg className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </span>
      );
    case 'stage_changed':
    case 'stage_moved_backward':
    case 'backward_move':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 ring-8 ring-white">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </span>
      );
    case 'responsible_changed':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 ring-8 ring-white">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
      );
    default:
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 ring-8 ring-white">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </span>
      );
  }
}

export default function TaskTimeline({ taskId }: TaskTimelineProps) {
  const [events, setEvents] = useState<TaskHistory[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsersAndHistory = async () => {
      try {
        setLoading(true);
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        const headers: HeadersInit = token ? { authorization: `Bearer ${token}` } : {};

        // Fetch users first for name mapping
        const usersRes = await fetch('/api/users', { headers });
        let mapping: Record<string, string> = {};
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          usersData.users.forEach((u: any) => {
            mapping[u.id] = u.displayName;
          });
          setUsersMap(mapping);
        }

        // Fetch task details (which contains history)
        const res = await fetch(`/api/tasks/${taskId}`, { headers });
        if (!res.ok) throw new Error('Failed to load history');

        const task = await res.json();
        setEvents(task.history || []);
      } catch (err) {
        setError('Falha ao carregar o histórico');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndHistory();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500 text-sm">Carregando histórico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Nenhum histórico disponível para esta tarefa.
      </div>
    );
  }

  // Helper to format event description beautifully
  const renderEventDescription = (event: TaskHistory) => {
    const actorName = usersMap[event.actor] || event.actor;

    switch (event.eventType) {
      case 'created':
        return (
          <div>
            <span className="font-semibold text-gray-900">{actorName}</span> criou a tarefa.
          </div>
        );

      case 'stage_changed': {
        const fromStage = formatValue('stageId', event.previousValue, usersMap);
        const toStage = formatValue('stageId', event.newValue, usersMap);
        const notes = (event.metadata as any)?.notes;
        return (
          <div className="space-y-1">
            <div>
              <span className="font-semibold text-gray-900">{actorName}</span> moveu o estágio de{' '}
              <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs font-semibold text-gray-700">
                {fromStage}
              </span>{' '}
              para{' '}
              <span className="inline-block px-1.5 py-0.5 bg-sky-100 rounded text-xs font-semibold text-sky-800">
                {toStage}
              </span>.
            </div>
            {notes && (
              <div className="text-xs text-gray-600 bg-amber-50 border-l-2 border-amber-300 px-2.5 py-1.5 rounded mt-1 italic">
                &ldquo;{notes}&rdquo;
              </div>
            )}
          </div>
        );
      }

      case 'responsible_changed': {
        const fromUser = formatValue('responsibleUserId', event.previousValue, usersMap);
        const toUser = formatValue('responsibleUserId', event.newValue, usersMap);
        return (
          <div>
            <span className="font-semibold text-gray-900">{actorName}</span> alterou o responsável de{' '}
            <span className="font-medium text-gray-800">{fromUser}</span> para{' '}
            <span className="font-semibold text-sky-700">{toUser}</span>.
          </div>
        );
      }

      case 'comment_added': {
        const preview = (event.metadata as any)?.preview || '';
        return (
          <div className="space-y-1">
            <div>
              <span className="font-semibold text-gray-900">{actorName}</span> adicionou um comentário.
            </div>
            {preview && (
              <div className="text-xs text-gray-600 bg-gray-50 border-l border-gray-300 px-2 py-1 rounded max-w-lg mt-1 italic line-clamp-2">
                &ldquo;{preview}&rdquo;
              </div>
            )}
          </div>
        );
      }

      case 'attachment_added': {
        const fileName = (event.metadata as any)?.fileName || 'arquivo';
        const sizeBytes = (event.metadata as any)?.fileSize;
        const sizeText = sizeBytes
          ? ` (${(sizeBytes / 1024).toFixed(1)} KB)`
          : '';
        return (
          <div>
            <span className="font-semibold text-gray-900">{actorName}</span> anexou o arquivo{' '}
            <span className="font-semibold text-sky-600 hover:underline cursor-pointer">{fileName}</span>
            {sizeText}.
          </div>
        );
      }

      case 'completed':
        return (
          <div>
            <span className="font-semibold text-gray-900">{actorName}</span> marcou a tarefa como{' '}
            <span className="inline-block px-1.5 py-0.5 bg-green-100 rounded text-xs font-semibold text-green-800">
              Concluída
            </span>.
          </div>
        );

      case 'archived':
        return (
          <div>
            <span className="font-semibold text-gray-900">{actorName}</span>{' '}
            <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs font-semibold text-gray-800">
              arquivou
            </span>{' '}
            a tarefa.
          </div>
        );

      case 'restored': {
        const targetStage = formatValue('stageId', (event.metadata as any)?.targetStage, usersMap);
        return (
          <div>
            <span className="font-semibold text-gray-900">{actorName}</span> restaurou a tarefa para o estágio{' '}
            <span className="font-medium text-gray-800">{targetStage}</span>.
          </div>
        );
      }

      case 'updated': {
        const prev = event.previousValue as Record<string, any>;
        const curr = event.newValue as Record<string, any>;

        if (prev && curr) {
          // Identify what fields changed
          const changes = Object.keys(prev).filter((k) => k !== 'updatedAt' && k !== 'updatedBy');
          if (changes.length > 0) {
            return (
              <div className="space-y-1">
                <div>
                  <span className="font-semibold text-gray-900">{actorName}</span> atualizou os campos da tarefa:
                </div>
                <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                  {changes.map((field) => {
                    const fieldLabel = FIELD_LABELS[field] || field;
                    const prevVal = formatValue(field, prev[field], usersMap);
                    const newVal = formatValue(field, curr[field], usersMap);
                    return (
                      <li key={field}>
                        <span className="font-medium text-gray-800">{fieldLabel}</span>: alterado de{' '}
                        <span className="line-through text-gray-400">{prevVal}</span> para{' '}
                        <span className="font-semibold text-gray-700">{newVal}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          }
        }
        return (
          <div>
            <span className="font-semibold text-gray-900">{actorName}</span> atualizou a tarefa.
          </div>
        );
      }

      default:
        return (
          <div>
            <span className="font-semibold text-gray-900">{actorName}</span> realizou uma ação: {event.eventType}.
          </div>
        );
    }
  };

  return (
    <div className="flow-root mt-4">
      <ul className="-mb-8">
        {events.map((event, index) => {
          const occurredDate = event.occurredAt ? new Date(event.occurredAt) : null;
          const timeText = occurredDate
            ? occurredDate.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <li key={event.id || index}>
              <div className="relative pb-8">
                {/* Vertical line connecting events */}
                {index !== events.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <EventIcon eventType={event.eventType} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                    <div className="text-sm text-gray-500">
                      {renderEventDescription(event)}
                    </div>
                    <div className="text-right text-xs whitespace-nowrap text-gray-400 font-medium">
                      {timeText}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

