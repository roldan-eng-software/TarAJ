'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { LoadingState, EmptyState } from '@/components/ui/StateViews';
import type { Task } from '@/src/types/domain';

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];
}

export default function ArchivePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchivedTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const params = new URLSearchParams();
      if (searchTerm) params.set('q', searchTerm);

      const res = await fetch(`/api/tasks?archived=true&${params.toString()}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error('Failed to load archived tasks');

      const data = await res.json();
      setTasks(data.tasks || data || []);
    } catch (err) {
      setError('Falha ao carregar tarefas arquivadas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchArchivedTasks();
  }, [fetchArchivedTasks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArchivedTasks();
  };

  if (loading) {
    return <LoadingState message="Carregando..." />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tarefas Arquivadas</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          placeholder="Buscar por título, descrição ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
        />
      </form>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {tasks.length === 0 ? (
        <EmptyState message="Nenhuma tarefa arquivada encontrada." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block p-4 bg-white rounded-lg border hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{task.referenceCode}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {task.archivedAt ? new Date(task.archivedAt).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {task.category}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {task.priority}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
