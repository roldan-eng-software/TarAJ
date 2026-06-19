'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { StageId, AlertEventType, RoleId } from '@/src/types/domain';

interface ConfigItem {
  id: string;
  stageId: StageId;
  eventType: AlertEventType;
  enabled: boolean;
  notifyResponsible: boolean;
  notifyCreator: boolean;
  notifyParticipants: boolean;
  notifyRoles: RoleId[];
}

const STAGE_LABELS: Record<StageId, string> = {
  entrada: 'Entrada',
  analise: 'Em análise',
  aguardando_docs: 'Aguardando documentos',
  andamento: 'Em andamento',
  revisao: 'Em revisão',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
};

const ROLE_LABELS: Record<RoleId, string> = {
  administrator: 'Administrador',
  coordinator: 'Coordenador',
  collaborator: 'Colaborador',
  internal_reader: 'Leitor Interno',
};

const EVENT_CATEGORIES: { label: string; events: AlertEventType[] }[] = [
  {
    label: 'Criação',
    events: ['task_created'],
  },
  {
    label: 'Responsável',
    events: ['responsible_changed'],
  },
  {
    label: 'Movimentação',
    events: ['stage_changed', 'stage_moved_backward'],
  },
  {
    label: 'Conclusão',
    events: ['task_completed'],
  },
  {
    label: 'Arquivamento',
    events: ['task_archived', 'task_restored'],
  },
  {
    label: 'Prazo',
    events: ['due_upcoming', 'due_overdue'],
  },
  {
    label: 'Menção',
    events: ['mentioned_in_comment'],
  },
];

const EVENT_LABELS: Record<string, string> = {
  task_created: 'Tarefa criada',
  responsible_changed: 'Responsável alterado',
  stage_changed: 'Estágio alterado (avanço)',
  stage_moved_backward: 'Estágio alterado (retorno)',
  task_completed: 'Tarefa concluída',
  task_archived: 'Tarefa arquivada',
  task_restored: 'Tarefa restaurada',
  due_upcoming: 'Prazo próximo',
  due_overdue: 'Prazo vencido',
  mentioned_in_comment: 'Menção em comentário',
};

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((r) => r.startsWith('token='))
    ?.split('=')[1];
}

function StageCard({
  stageId,
  configs,
  onUpdate,
}: {
  stageId: StageId;
  configs: ConfigItem[];
  onUpdate: (configId: string, updates: Record<string, unknown>) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState(EVENT_CATEGORIES[0].label);

  const stageConfigs = configs.filter((c) => c.stageId === stageId);
  const allEnabled = stageConfigs.every((c) => c.enabled);

  const toggleAll = async () => {
    const newEnabled = !allEnabled;
    for (const config of stageConfigs) {
      await onUpdate(config.id, { enabled: newEnabled });
    }
  };

  const categoryConfigs = (category: typeof EVENT_CATEGORIES[0]) =>
    stageConfigs.filter((c) => category.events.includes(c.eventType));

  const allRoleIds: RoleId[] = ['administrator', 'coordinator', 'collaborator', 'internal_reader'];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">{STAGE_LABELS[stageId]}</h3>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <span>Ativar todos</span>
          <input
            type="checkbox"
            checked={allEnabled}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 px-5 pt-4 pb-2 border-b border-gray-100">
        {EVENT_CATEGORIES.map((cat) => {
          const catCfgs = categoryConfigs(cat);
          const hasEnabled = catCfgs.some((c) => c.enabled);
          return (
            <button
              key={cat.label}
              onClick={() => setActiveTab(cat.label)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                activeTab === cat.label
                  ? 'bg-sky-100 text-sky-800 border border-sky-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {cat.label}
              {catCfgs.length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  hasEnabled ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-500'
                }`}>
                  {catCfgs.filter((c) => c.enabled).length}/{catCfgs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Event rows */}
      <div className="p-5 space-y-4">
        {EVENT_CATEGORIES.find((c) => c.label === activeTab)?.events.map((eventType) => {
          const config = stageConfigs.find((c) => c.eventType === eventType);
          if (!config) return null;

          return (
            <div key={config.id} className="space-y-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
              {/* Event header with enable toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">
                  {EVENT_LABELS[eventType] || eventType}
                </span>
                <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                  <span>{config.enabled ? 'Ativo' : 'Inativo'}</span>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => onUpdate(config.id, { enabled: !config.enabled })}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                </label>
              </div>

              {/* Recipient checkboxes */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${!config.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notifyResponsible}
                    onChange={() => onUpdate(config.id, { notifyResponsible: !config.notifyResponsible })}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  Responsável
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notifyCreator}
                    onChange={() => onUpdate(config.id, { notifyCreator: !config.notifyCreator })}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  Criador
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notifyParticipants}
                    onChange={() => onUpdate(config.id, { notifyParticipants: !config.notifyParticipants })}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  Participantes
                </label>
                <div className="col-span-2 sm:col-span-1">
                  <select
                    multiple
                    value={config.notifyRoles}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (opt) => opt.value as RoleId);
                      onUpdate(config.id, { notifyRoles: selected });
                    }}
                    className="w-full text-xs input-base text-gray-900 h-20"
                  >
                    {allRoleIds.map((roleId) => (
                      <option key={roleId} value={roleId}>
                        {ROLE_LABELS[roleId]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        {EVENT_CATEGORIES.find((c) => c.label === activeTab) && 
          categoryConfigs(EVENT_CATEGORIES.find((c) => c.label === activeTab)!).length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhum evento configurável nesta categoria
          </p>
        )}
      </div>
    </div>
  );
}

export default function AlertSettingsPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const res = await fetch('/api/admin/alert-config', {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 403) {
        setError('Acesso restrito a administradores.');
        return;
      }
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Falha ao carregar configurações');

      const data = await res.json();
      setConfigs(data.configs || []);
    } catch {
      setError('Falha ao carregar configurações de alertas');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleUpdate = async (configId: string, updates: Record<string, unknown>) => {
    setSavingId(configId);
    try {
      const token = getToken();
      const res = await fetch('/api/admin/alert-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ configId, ...updates }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar');

      // Optimistic update
      setConfigs((prev) =>
        prev.map((c) => (c.id === configId ? { ...c, ...updates } as ConfigItem : c))
      );
    } catch {
      setError('Falha ao salvar alteração');
    } finally {
      setSavingId(null);
    }
  };

  const stageIds: StageId[] = ['entrada', 'analise', 'aguardando_docs', 'andamento', 'revisao', 'concluida', 'arquivada'];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Configuração de Alertas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Defina quais eventos disparam alertas e quem os recebe, por estágio do Kanban
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 flex items-center justify-between">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">Carregando configurações...</p>
        </div>
      )}

      {/* Saving indicator */}
      {savingId && (
        <div className="fixed bottom-4 right-4 bg-sky-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          Salvando...
        </div>
      )}

      {/* Cards grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stageIds.map((stageId) => (
            <StageCard
              key={stageId}
              stageId={stageId}
              configs={configs}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
