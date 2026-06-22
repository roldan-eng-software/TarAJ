'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskCategory } from '@/src/types/domain';

function getToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((r) => r.startsWith('token='))
    ?.split('=')[1];
}

interface CategoryModalProps {
  mode: 'create' | 'edit';
  category?: TaskCategory;
  onClose: () => void;
  onSave: (data: { name: string; order: number }) => Promise<void>;
}

function CategoryModal({ mode, category, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [order, setOrder] = useState(category?.order ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), order });
      onClose();
    } catch {
      setError('Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {mode === 'create' ? 'Nova Categoria' : 'Editar Categoria'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Ordem</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; category?: TaskCategory } | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const res = await fetch('/api/admin/categories', {
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
      if (!res.ok) throw new Error('Falha ao carregar');

      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      setError('Falha ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (data: { name: string; order: number }) => {
    const token = getToken();
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao criar');
    await fetchCategories();
  };

  const handleUpdate = async (categoryId: string, data: { name?: string; order?: number }) => {
    const token = getToken();
    const res = await fetch(`/api/admin/categories/${categoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao atualizar');
    await fetchCategories();
  };

  const handleToggleActive = async (category: TaskCategory) => {
    const token = getToken();
    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !category.active }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar');
    await fetchCategories();
  };

  const handleDelete = async (category: TaskCategory) => {
    if (!confirm(`Tem certeza que deseja excluir "${category.name}"?`)) return;

    const token = getToken();
    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Falha ao excluir');
    await fetchCategories();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie as categorias disponíveis para classificação de tarefas
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition"
        >
          Nova Categoria
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 flex items-center justify-between">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">Carregando categorias...</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Ordem</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-center px-5 py-3 font-medium text-gray-600">Ativo</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">{cat.order}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs font-mono">{cat.slug}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                          cat.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {cat.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ mode: 'edit', category: cat })}
                          className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 rounded-lg hover:bg-sky-100 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <CategoryModal
          mode={modal.mode}
          category={modal.category}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal.mode === 'create') {
              await handleCreate(data);
            } else if (modal.category) {
              await handleUpdate(modal.category.id, data);
            }
          }}
        />
      )}
    </div>
  );
}
