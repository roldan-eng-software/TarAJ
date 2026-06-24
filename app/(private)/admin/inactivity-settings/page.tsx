'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/StateViews';

export default function InactivitySettingsPage() {
  const router = useRouter();
  const [daysThreshold, setDaysThreshold] = useState(7);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/inactivity-config', {
        credentials: 'include',
      });

      if (res.status === 403) {
        setError('Acesso restrito a administradores e coordenadores.');
        return;
      }
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Falha ao carregar configuração');

      const data = await res.json();
      setDaysThreshold(data.config?.daysThreshold ?? 7);
      setEnabled(data.config?.enabled ?? true);
    } catch {
      setError('Falha ao carregar configuração de inatividade');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/inactivity-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ daysThreshold, enabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao salvar');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Carregando configuração..." />;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Configuração de Inatividade</h1>
        <p className="text-sm text-gray-500 mt-1">
          Defina o prazo de inatividade para alertas automáticos de tarefas sem movimentação
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 flex items-center justify-between">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-6">
          <p className="text-emerald-700 text-sm">Configuração salva com sucesso!</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Alertas de inatividade</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Quando habilitado, o sistema verifica tarefas sem movimentação e envia alertas
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => setEnabled(!enabled)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
          </label>
        </div>

        {/* Days threshold */}
        <div className={`${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
          <label htmlFor="daysThreshold" className="block text-sm font-medium text-gray-900 mb-2">
            Dias sem movimentação
          </label>
          <div className="flex items-center gap-3">
            <input
              id="daysThreshold"
              type="number"
              min={1}
              max={365}
              value={daysThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) setDaysThreshold(Math.max(1, Math.min(365, val)));
              }}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 text-sm"
            />
            <span className="text-sm text-gray-600">dias</span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Tarefas sem nenhuma atividade por este número de dias gerarão alertas para os destinatários configurados.
          </p>
        </div>

        {/* Info box */}
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-sky-900 mb-1">Como funciona</h4>
          <ul className="text-xs text-sky-800 space-y-1">
            <li>O sistema verifica periodicamente tarefas ativas (não arquivadas)</li>
            <li>Uma tarefa é considerada inativa quando não recebe atualizações, comentários ou anexos pelo período configurado</li>
            <li>Os destinatários dos alertas são definidos em <strong>Configuração de Alertas</strong> &gt; <strong>Inatividade</strong></li>
            <li>O alerta gera notificação interna e e-mail para os destinatários</li>
          </ul>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {saving ? 'Salvando...' : 'Salvar configuração'}
          </button>
        </div>
      </div>
    </div>
  );
}
