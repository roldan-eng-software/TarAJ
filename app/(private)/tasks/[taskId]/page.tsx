'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TaskTimeline from '@/components/tasks/TaskTimeline';
import TaskComments from '@/components/tasks/TaskComments';
import TaskAttachments from '@/components/tasks/TaskAttachments';
import ArchiveActions from '@/components/tasks/ArchiveActions';
import type { Task } from '@/src/types/domain';
import type { TaskComment } from '@/src/domain/comments/comment-service';
import type { TaskAttachment } from '@/src/domain/attachments/attachment-service';

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];
}

type Tab = 'timeline' | 'comments' | 'attachments';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('timeline');

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();

      const res = await fetch(`/api/tasks/${taskId}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 404) {
          setError('Tarefa não encontrada');
          return;
        }
        throw new Error('Failed to load task');
      }

      const data: Task = await res.json();
      setTask(data);

      const [commentsRes, attachmentsRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}/comments`, {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        }),
        fetch(`/api/tasks/${taskId}/attachments`, {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        }),
      ]);

      if (commentsRes.ok) {
        const commentsData: TaskComment[] = await commentsRes.json();
        setComments(commentsData);
      }

      if (attachmentsRes.ok) {
        const attachmentsData: TaskAttachment[] = await attachmentsRes.json();
        setAttachments(attachmentsData);
      }
    } catch (err) {
      setError('Falha ao carregar tarefa');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveSuccess = (updatedTask: Task) => {
    setTask(updatedTask);
  };

  const handleRestoreSuccess = (updatedTask: Task) => {
    setTask(updatedTask);
  };

  const getStageLabel = (stageId: string): string => {
    const labels: Record<string, string> = {
      entrada: 'Entrada',
      analise: 'Em análise',
      aguardando_docs: 'Aguardando documentos',
      andamento: 'Em andamento',
      revisao: 'Em revisão',
      concluida: 'Concluída',
      arquivada: 'Arquivada',
    };
    return labels[stageId] || stageId;
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      crítica: 'bg-red-100 text-red-800',
      alta: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      baixa: 'bg-gray-100 text-gray-600',
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-lg">Carregando tarefa...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || 'Tarefa não encontrada'}</p>
          <button
            onClick={() => router.push('/kanban')}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            Voltar ao Kanban
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => router.push('/kanban')}
        className="mb-4 text-sm text-sky-600 hover:text-sky-700"
      >
        &larr; Voltar ao Kanban
      </button>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {task.referenceCode} &bull; {getStageLabel(task.stageId)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500">Categoria:</span>{' '}
            <span className="text-gray-900">{task.category}</span>
          </div>
          <div>
            <span className="text-gray-500">Confidencialidade:</span>{' '}
            <span className="text-gray-900">{task.confidentialityLevel}</span>
          </div>
          {task.dueDate && (
            <div>
              <span className="text-gray-500">Prazo:</span>{' '}
              <span className="text-gray-900">
                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Criado em:</span>{' '}
            <span className="text-gray-900">
              {new Date(task.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {task.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Descrição</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {task.internalNotes && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-medium text-amber-900 mb-1">Notas internas</h3>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{task.internalNotes}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <ArchiveActions
          task={task}
          onArchiveSuccess={handleArchiveSuccess}
          onRestoreSuccess={handleRestoreSuccess}
        />
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {(['timeline', 'comments', 'attachments'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'timeline' && 'Histórico'}
              {tab === 'comments' && `Comentários (${comments.length})`}
              {tab === 'attachments' && `Anexos (${attachments.length})`}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'timeline' && <TaskTimeline taskId={taskId} />}
        {activeTab === 'comments' && (
          <TaskComments taskId={taskId} comments={comments} />
        )}
        {activeTab === 'attachments' && (
          <TaskAttachments taskId={taskId} attachments={attachments} />
        )}
      </div>
    </div>
  );
}
