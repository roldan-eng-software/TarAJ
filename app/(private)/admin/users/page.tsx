'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { RoleId } from '@/src/types/domain';

interface UserRow {
  id: string;
  displayName: string;
  email: string;
  roleId: RoleId;
  status: 'active' | 'disabled';
  createdAt: string;
}

const ROLE_LABELS: Record<RoleId, string> = {
  administrator: 'Administrador',
  coordinator: 'Coordenador',
  collaborator: 'Colaborador',
  internal_reader: 'Leitor Interno',
};

const ROLE_COLORS: Record<RoleId, string> = {
  administrator: 'bg-purple-100 text-purple-800',
  coordinator: 'bg-sky-100 text-sky-800',
  collaborator: 'bg-emerald-100 text-emerald-800',
  internal_reader: 'bg-gray-100 text-gray-700',
};

// ── Create User Modal ────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: '', displayName: '', roleId: 'collaborator' as RoleId, password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.displayName || !form.password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Erro ao criar usuário');
        return;
      }
      onCreated();
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Novo Usuário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full input-base text-gray-900" placeholder="Nome do usuário" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full input-base text-gray-900" placeholder="usuario@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha inicial *</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full input-base text-gray-900" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
            <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value as RoleId })}
              className="w-full input-base text-gray-900">
              {Object.entries(ROLE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 button-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 button-primary disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit User Modal ──────────────────────────────────────────────
function EditUserModal({ user, onClose, onUpdated }: { user: UserRow; onClose: () => void; onUpdated: () => void }) {
  const [form, setForm] = useState({ displayName: user.displayName, roleId: user.roleId as RoleId, status: user.status });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Erro ao atualizar');
        return;
      }
      onUpdated();
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Erro ao gerar link');
        return;
      }
      const data = await res.json();
      setResetLink(data.resetLink);
    } catch {
      setError('Erro de conexão');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar Usuário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={user.email} disabled className="w-full input-base bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full input-base text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
            <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value as RoleId })}
              className="w-full input-base text-gray-900">
              {Object.entries(ROLE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'disabled' })}
              className="w-full input-base text-gray-900">
              <option value="active">Ativo</option>
              <option value="disabled">Desativado</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <button type="button" onClick={handleResetPassword}
              className="text-sm text-sky-600 hover:text-sky-800 font-medium">
              🔑 Gerar link de redefinição de senha
            </button>
            {resetLink && (
              <div className="mt-2 p-3 bg-sky-50 border border-sky-200 rounded text-xs break-all">
                <p className="font-medium text-sky-800 mb-1">Link gerado (envie ao usuário):</p>
                <code className="text-sky-700">{resetLink}</code>
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 button-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 button-primary disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Admin Users Page ────────────────────────────────────────
export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterRole) params.set('roleId', filterRole);
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
      });

      if (res.status === 403) {
        setError('Acesso restrito a administradores.');
        return;
      }
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Falha ao carregar usuários');

      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError('Falha ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [router, filterRole, filterStatus, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const activeCount = users.filter((u) => u.status === 'active').length;
  const disabledCount = users.filter((u) => u.status === 'disabled').length;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} usuário{users.length !== 1 ? 's' : ''} • {activeCount} ativo{activeCount !== 1 ? 's' : ''} • {disabledCount} desativado{disabledCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition shadow-sm">
          + Novo Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="flex-1 input-base text-gray-900 text-sm"
        />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          className="input-base text-gray-900 text-sm min-w-[160px]">
          <option value="">Todos os papéis</option>
          {Object.entries(ROLE_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="input-base text-gray-900 text-sm min-w-[130px]">
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="disabled">Desativado</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">Carregando usuários...</p>
        </div>
      )}

      {/* User Table */}
      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Papel</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.roleId]}`}>
                        {ROLE_LABELS[user.roleId] ?? user.roleId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.status === 'active' ? 'text-emerald-700' : 'text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        {user.status === 'active' ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditingUser(user)}
                        className="text-sky-600 hover:text-sky-800 text-sm font-medium">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-400">Nenhum usuário encontrado</div>
            )}
            {users.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.displayName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingUser(user)}
                    className="text-sky-600 hover:text-sky-800 text-sm font-medium">
                    Editar
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3 ml-13">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.roleId]}`}>
                    {ROLE_LABELS[user.roleId] ?? user.roleId}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs ${user.status === 'active' ? 'text-emerald-700' : 'text-red-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {user.status === 'active' ? 'Ativo' : 'Desativado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchUsers(); }}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={() => { setEditingUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}
