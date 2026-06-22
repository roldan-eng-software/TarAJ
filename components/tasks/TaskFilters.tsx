'use client';

import { useState, useEffect } from 'react';

interface TaskFiltersProps {
  onFilter: (params: Record<string, string>) => void;
  showStage?: boolean;
  showArchived?: boolean;
}

export default function TaskFilters({ onFilter, showStage = true, showArchived = false }: TaskFiltersProps) {
  const [stageId, setStageId] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [confidentialityLevel, setConfidentialityLevel] = useState('');
  const [dueDateStatus, setDueDateStatus] = useState('');
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState('');
  const [users, setUsers] = useState<{ id: string; displayName: string }[]>([]);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [usersRes, catsRes] = await Promise.all([
        fetch('/api/users', { credentials: 'include' }),
        fetch('/api/categories', { credentials: 'include' }),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (catsRes.ok) {
        const data = await catsRes.json();
        setCategories(data.categories || []);
      }
    };
    load();
  }, []);

  const apply = () => {
    const params: Record<string, string> = {};
    if (stageId) params.stageId = stageId;
    if (priority) params.priority = priority;
    if (category) params.category = category;
    if (responsibleUserId) params.responsibleUserId = responsibleUserId;
    if (confidentialityLevel) params.confidentialityLevel = confidentialityLevel;
    if (dueDateStatus) params.dueDateStatus = dueDateStatus;
    if (q) params.q = q;
    if (archived) params.archived = archived;
    onFilter(params);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apply();
  };

  const handleClear = () => {
    setStageId('');
    setPriority('');
    setCategory('');
    setResponsibleUserId('');
    setConfidentialityLevel('');
    setDueDateStatus('');
    setQ('');
    setArchived('');
    onFilter({});
  };

  const stages = [
    { id: 'entrada', label: 'Entrada' },
    { id: 'analise', label: 'Em análise' },
    { id: 'aguardando_docs', label: 'Aguardando docs' },
    { id: 'andamento', label: 'Em andamento' },
    { id: 'revisao', label: 'Em revisão' },
    { id: 'concluida', label: 'Concluída' },
  ];

  const priorities = ['baixa', 'normal', 'alta', 'crítica'];

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 mb-6 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Busca</label>
          <input
            type="text"
            placeholder="Título, descrição ou código..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {showStage && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estágio</label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">Todos</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="">Todas</option>
            {priorities.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Responsável</label>
          <select
            value={responsibleUserId}
            onChange={(e) => setResponsibleUserId(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.displayName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Prazo</label>
          <select
            value={dueDateStatus}
            onChange={(e) => setDueDateStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="">Todos</option>
            <option value="upcoming">Próximos (3 dias)</option>
            <option value="overdue">Vencidos</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Confidencialidade</label>
          <select
            value={confidentialityLevel}
            onChange={(e) => setConfidentialityLevel(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="">Todas</option>
            <option value="interno">Interno</option>
            <option value="restrito">Restrito</option>
            <option value="público">Público</option>
          </select>
        </div>

        {showArchived && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Arquivado</label>
            <select
              value={archived}
              onChange={(e) => setArchived(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">Todos</option>
              <option value="true">Arquivados</option>
              <option value="false">Ativos</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="px-4 py-1.5 text-sm font-medium bg-sky-600 text-white rounded-md hover:bg-sky-700 transition cursor-pointer"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition cursor-pointer"
        >
          Limpar
        </button>
      </div>
    </form>
  );
}
