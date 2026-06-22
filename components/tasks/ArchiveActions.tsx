'use client';

import { useState } from 'react';
import type { Task } from '@/src/types/domain';

interface ArchiveActionsProps {
  task: Task;
  onArchiveSuccess?: (task: Task) => void;
  onRestoreSuccess?: (task: Task) => void;
}

export default function ArchiveActions({
  task,
  onArchiveSuccess,
  onRestoreSuccess,
}: ArchiveActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);
  const [showRestoreForm, setShowRestoreForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState('entrada');

  const handleArchive = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/tasks/${task.id}/archive`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to archive task');
      }

      const updatedTask: Task = await res.json();
      setShowConfirmArchive(false);
      onArchiveSuccess?.(updatedTask);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao arquivar tarefa');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/tasks/${task.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stageId: selectedStage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to restore task');
      }

      const updatedTask: Task = await res.json();
      setShowRestoreForm(false);
      onRestoreSuccess?.(updatedTask);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao restaurar tarefa');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (task.archived) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-900">
            Esta tarefa está arquivada
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Tarefas arquivadas são somente leitura mas mantêm todo o histórico.
          </p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {!showRestoreForm && (
          <button
            onClick={() => setShowRestoreForm(true)}
            className="px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            Restaurar tarefa
          </button>
        )}

        {showRestoreForm && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <label className="block">
              <span className="block text-sm font-medium text-gray-900 mb-2">
                Restaurar para qual estágio?
              </span>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="entrada">Entrada</option>
                <option value="analise">Em análise</option>
                <option value="andamento">Em andamento</option>
                <option value="revisao">Em revisão</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleRestore}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Restaurando...' : 'Restaurar'}
              </button>
              <button
                onClick={() => setShowRestoreForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (task.stageId !== 'concluida') {
    return (
      <div className="text-sm text-gray-600">
        <p>Apenas tarefas concluídas podem ser arquivadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!showConfirmArchive && (
        <button
          onClick={() => setShowConfirmArchive(true)}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Arquivar tarefa
        </button>
      )}

      {showConfirmArchive && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
          <p className="text-sm font-medium text-amber-900">
            Confirmar arquivamento?
          </p>
          <p className="text-xs text-amber-700">
            A tarefa será removida do Kanban, mas todo o histórico será preservado.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleArchive}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Arquivando...' : 'Sim, arquivar'}
            </button>
            <button
              onClick={() => setShowConfirmArchive(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
