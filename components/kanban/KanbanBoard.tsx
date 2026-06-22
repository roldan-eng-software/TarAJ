'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TaskCard from '@/components/kanban/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import TaskFilters from '@/components/tasks/TaskFilters';
import type { Task } from '@/src/types/domain';
import type { TaskFormData } from '@/components/tasks/TaskForm';

type StageId = Task['stageId'];

const STAGES: { id: StageId; label: string }[] = [
  { id: 'entrada', label: 'Entrada' },
  { id: 'analise', label: 'Em análise' },
  { id: 'aguardando_docs', label: 'Aguardando docs' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'revisao', label: 'Em revisão' },
  { id: 'concluida', label: 'Concluída' },
];

export default function KanbanBoard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [filterParams, setFilterParams] = useState<Record<string, string>>({});
  const [mobileStage, setMobileStage] = useState<StageId>('entrada');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ archived: 'false', limit: '100', ...filterParams });
      const res = await fetch(`/api/tasks?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load tasks');
      }

      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError('Falha ao carregar tarefas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        (data.users || []).forEach((u: { id: string; displayName: string }) => {
          map[u.id] = u.displayName;
        });
        setUsers(map);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const handleFilter = (params: Record<string, string>) => {
    setFilterParams(params);
  };

  const handleMove = async (taskId: string, targetStageId: StageId) => {
    try {
      setMovingTaskId(taskId);
      const res = await fetch(`/api/tasks/${taskId}/transitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetStageId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erro ao mover tarefa');
        return;
      }

      await fetchTasks();
    } catch (err) {
      console.error('Error moving task:', err);
      alert('Erro ao mover tarefa');
    } finally {
      setMovingTaskId(null);
    }
  };

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Erro ao criar tarefa');
        return;
      }

      setShowCreateForm(false);
      await fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Erro ao criar tarefa');
    }
  };

  const getTasksByStage = (stageId: StageId): Task[] => {
    return tasks.filter((t) => t.stageId === stageId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <p className="text-gray-500 text-lg">Carregando quadro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="alert">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Kanban</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition cursor-pointer"
        >
          + Nova tarefa
        </button>
      </div>

      <TaskFilters onFilter={handleFilter} showStage />

      {/* Mobile: stage selector + vertical list */}
      <div className="md:hidden mb-4">
        <select
          value={mobileStage}
          onChange={(e) => setMobileStage(e.target.value as StageId)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
        >
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} ({getTasksByStage(s.id).length})
            </option>
          ))}
        </select>

        <div className="mt-3 space-y-2">
          {getTasksByStage(mobileStage).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma tarefa neste estágio</p>
          )}
          {getTasksByStage(mobileStage).map((task) => (
            <div key={task.id} className="relative">
              <div onClick={() => router.push(`/tasks/${task.id}`)} className="cursor-pointer">
                <TaskCard
                  taskId={task.id}
                  title={task.title}
                  priority={task.priority}
                  responsibleUserId={task.responsibleUserId}
                  responsiblePersonName={users[task.responsibleUserId]}
                  dueDate={task.dueDate}
                  stageId={task.stageId}
                />
              </div>
              <div className="absolute top-2 right-2">
                <select
                  value=""
                  onChange={(e) => { const val = e.target.value; if (val) handleMove(task.id, val as StageId); }}
                  disabled={movingTaskId === task.id}
                  className="text-xs border border-gray-300 rounded bg-white px-1 py-0.5 shadow-sm"
                >
                  <option value="" disabled>Mover para...</option>
                  {getAvailableTargets(mobileStage).map((target) => (
                    <option key={target.id} value={target.id}>{target.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: horizontal scroll columns */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageTasks = getTasksByStage(stage.id);
          return (
            <div
              key={stage.id}
              role="region"
              aria-labelledby={stage.id + '-heading'}
              className="flex-shrink-0 w-72 bg-gray-100 rounded-lg"
            >
              <div className="px-3 py-2 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 id={stage.id + '-heading'} className="font-semibold text-sm text-gray-900">
                    {stage.label}
                  </h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                    {stageTasks.length}
                  </span>
                </div>
              </div>

              <div className="p-2 space-y-2 min-h-[200px]">
                {stageTasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Nenhuma tarefa
                  </p>
                )}

                {stageTasks.map((task) => (
                  <div key={task.id} className="relative group">
                    <div
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="cursor-pointer"
                    >
                      <TaskCard
                        taskId={task.id}
                        title={task.title}
                        priority={task.priority}
                        responsibleUserId={task.responsibleUserId}
                        responsiblePersonName={users[task.responsibleUserId]}
                        dueDate={task.dueDate}
                        stageId={task.stageId}
                      />
                    </div>

                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition">
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleMove(task.id, val as StageId);
                        }}
                        disabled={movingTaskId === task.id}
                        className="text-xs border border-gray-300 rounded bg-white px-1 py-0.5 shadow-sm"
                      >
                        <option value="" disabled>
                          Mover para...
                        </option>
                        {getAvailableTargets(stage.id).map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onKeyDown={(e) => { if (e.key === 'Escape') setShowCreateForm(false); }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nova tarefa</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                aria-label="Fechar"
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
              >
                &times;
              </button>
            </div>
            <TaskForm onSubmit={handleCreateTask} />
          </div>
        </div>
      )}
    </div>
  );
}

function getAvailableTargets(stageId: StageId): { id: string; label: string }[] {
  const transitions: Record<StageId, string[]> = {
    entrada: ['analise'],
    analise: ['aguardando_docs', 'andamento', 'entrada'],
    aguardando_docs: ['andamento', 'analise'],
    andamento: ['revisao', 'entrada', 'analise', 'aguardando_docs'],
    revisao: ['concluida', 'andamento'],
    concluida: [],
    arquivada: [],
  };

  const stageLabels: Record<string, string> = {
    entrada: 'Entrada',
    analise: 'Em análise',
    aguardando_docs: 'Aguardando docs',
    andamento: 'Em andamento',
    revisao: 'Em revisão',
    concluida: 'Concluída',
  };

  return (transitions[stageId] || []).map((id) => ({
    id,
    label: stageLabels[id] || id,
  }));
}
