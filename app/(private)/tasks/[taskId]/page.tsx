'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TaskTimeline from '@/components/tasks/TaskTimeline';
import TaskComments from '@/components/tasks/TaskComments';
import TaskAttachments from '@/components/tasks/TaskAttachments';
import TaskForm from '@/components/tasks/TaskForm';
import type { TaskFormData } from '@/components/tasks/TaskForm';
import ArchiveActions from '@/components/tasks/ArchiveActions';
import { LoadingState, ErrorState } from '@/components/ui/StateViews';
import type { Task } from '@/src/types/domain';
import type { TaskComment } from '@/src/domain/comments/comment-service';
import type { TaskAttachment } from '@/src/domain/attachments/attachment-service';

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
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/tasks/${taskId}`, {
        credentials: 'include',
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
          credentials: 'include',
        }),
        fetch(`/api/tasks/${taskId}/attachments`, {
          credentials: 'include',
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
  }, [taskId, router]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleEdit = async (data: TaskFormData) => {
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update task');
      }

      setEditing(false);
      fetchTask();
    } catch (err: any) {
      setEditError(err.message || 'Erro ao atualizar tarefa');
    } finally {
      setEditLoading(false);
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
    return <LoadingState message="Carregando tarefa..." />;
  }

  if (error || !task) {
    return <ErrorState message={error || 'Tarefa não encontrada'} />;
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
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

      <div className="flex gap-2 mb-6">
        {!task.archived && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition cursor-pointer"
          >
            Editar
          </button>
        )}
        <ArchiveActions
          task={task}
          onArchiveSuccess={handleArchiveSuccess}
          onRestoreSuccess={handleRestoreSuccess}
        />
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Editar tarefa</h2>
              <button
                onClick={() => { setEditing(false); setEditError(null); }}
                className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
                aria-label="Fechar"
              >
                &times;
              </button>
            </div>
            {editError && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded mb-4">{editError}</p>
            )}
            <TaskForm
              onSubmit={handleEdit}
              initialData={{
                title: task.title,
                description: task.description,
                category: task.category,
                priority: task.priority,
                responsibleUserId: task.responsibleUserId,
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                confidentialityLevel: task.confidentialityLevel,
                internalNotes: task.internalNotes,
              }}
              isEditing
            />
            {editLoading && (
              <p className="text-sm text-gray-500 mt-2 text-center">Salvando...</p>
            )}
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4 sm:gap-6 overflow-x-auto">
          {(['timeline', 'comments', 'attachments'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none rounded ${
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
