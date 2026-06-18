'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TaskTimeline from '@/components/tasks/TaskTimeline';
import TaskComments from '@/components/tasks/TaskComments';
import TaskAttachments from '@/components/tasks/TaskAttachments';
import type { Task } from '@/src/types/domain';
import type { TaskComment } from '@/src/domain/comments/comment-service';
import type { TaskAttachment } from '@/src/domain/attachments/attachment-service';

type Tab = 'history' | 'comments' | 'attachments';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTaskAndUsers = async () => {
      try {
        setLoading(true);
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        const headers: HeadersInit = token ? { authorization: `Bearer ${token}` } : {};

        // Fetch users mapping
        const usersRes = await fetch('/api/users', { headers });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const mapping: Record<string, string> = {};
          usersData.users.forEach((u: any) => {
            mapping[u.id] = u.displayName;
          });
          setUsersMap(mapping);
        }

        const [taskRes, commentsRes, attachmentsRes] = await Promise.all([
          fetch(`/api/tasks/${taskId}`, { headers }),
          fetch(`/api/tasks/${taskId}/comments`, { headers }),
          fetch(`/api/tasks/${taskId}/attachments`, { headers }),
        ]);

        if (!taskRes.ok) {
          throw new Error(taskRes.status === 404 ? 'Task not found' : 'Failed to load');
        }

        setTask(await taskRes.json());
        if (commentsRes.ok) setComments(await commentsRes.json());
        if (attachmentsRes.ok) setAttachments(await attachmentsRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndUsers();
  }, [taskId]);

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
        <p className="text-red-500 text-lg">{error || 'Tarefa não encontrada'}</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'history', label: 'Histórico' },
    { id: 'comments', label: 'Comentários' },
    { id: 'attachments', label: 'Anexos' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {task.referenceCode} • {task.category} • {task.priority} • {task.stageId}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Responsável</dt>
              <dd className="font-semibold text-gray-950">
                {usersMap[task.responsibleUserId] || task.responsibleUserId}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Prazo</dt>
              <dd className="font-medium">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Confidencialidade</dt>
              <dd className="font-medium">{task.confidentialityLevel}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Criada em</dt>
              <dd className="font-medium">{new Date(task.createdAt).toLocaleString('pt-BR')}</dd>
            </div>
          </dl>
          {task.description && (
            <div className="mt-4">
              <dt className="text-sm text-gray-500">Descrição</dt>
              <dd className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{task.description}</dd>
            </div>
          )}
        </div>

        <div className="border-b">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'history' && <TaskTimeline taskId={taskId} />}
          {activeTab === 'comments' && <TaskComments taskId={taskId} comments={comments} />}
          {activeTab === 'attachments' && <TaskAttachments taskId={taskId} attachments={attachments} />}
        </div>
      </div>
    </div>
  );
}

