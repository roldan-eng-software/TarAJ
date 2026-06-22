'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/src/firebase/client';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type Tab = 'profile' | 'password' | 'notifications';

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Notification prefs state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [enabledEvents, setEnabledEvents] = useState<string[]>([]);
  const [notifMessage, setNotifMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);

  const ALL_EVENT_TYPES = [
    { id: 'task_created', label: 'Tarefa criada' },
    { id: 'task_assigned', label: 'Tarefa atribuída' },
    { id: 'stage_changed', label: 'Estágio alterado' },
    { id: 'responsible_changed', label: 'Responsável alterado' },
    { id: 'mentioned', label: 'Menção em comentário' },
    { id: 'task_completed', label: 'Tarefa concluída' },
    { id: 'task_archived', label: 'Tarefa arquivada' },
    { id: 'backward_move', label: 'Retorno de estágio' },
    { id: 'due_upcoming', label: 'Prazo próximo' },
    { id: 'due_overdue', label: 'Prazo vencido' },
    { id: 'task_restored', label: 'Tarefa restaurada' },
  ];

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email || '');
      setUserId(user.uid);
      setChecking(false);

      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.displayName || '');
          if (data.notificationPrefs) {
            setEmailNotifications(data.notificationPrefs.emailNotifications ?? true);
            setEnabledEvents(data.notificationPrefs.enabledEvents || []);
          }
        }
      } catch {
        // ignore
      }
    });
    return unsubscribe;
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!displayName || displayName.trim().length < 2) {
      setProfileMessage({ type: 'error', text: 'O nome deve ter pelo menos 2 caracteres.' });
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() }),
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar perfil');
      }

      setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Erro ao atualizar perfil.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Preencha todos os campos.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'A nova senha e a confirmação não conferem.' });
      return;
    }

    setPasswordLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        setPasswordMessage({ type: 'error', text: 'Usuário não autenticado.' });
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordMessage({ type: 'error', text: 'Senha atual incorreta.' });
      } else if (code === 'auth/weak-password') {
        setPasswordMessage({ type: 'error', text: 'A nova senha é muito fraca. Use pelo menos 6 caracteres.' });
      } else if (code === 'auth/too-many-requests') {
        setPasswordMessage({ type: 'error', text: 'Muitas tentativas. Tente novamente mais tarde.' });
      } else {
        setPasswordMessage({ type: 'error', text: 'Erro ao alterar senha. Tente novamente.' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Verificando autenticação...</p>
      </div>
    );
  }

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifMessage(null);
    setNotifLoading(true);

    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          notificationPrefs: { emailNotifications, enabledEvents },
        }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Erro ao salvar preferências');
      setNotifMessage({ type: 'success', text: 'Preferências salvas com sucesso!' });
    } catch {
      setNotifMessage({ type: 'error', text: 'Erro ao salvar preferências.' });
    } finally {
      setNotifLoading(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setEnabledEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const tabs = [
    { id: 'profile' as Tab, label: 'Perfil' },
    { id: 'password' as Tab, label: 'Senha' },
    { id: 'notifications' as Tab, label: 'Notificações' },
  ];

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>

      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition cursor-pointer ${
              tab === t.id
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Meu perfil</h2>
          <p className="text-sm text-gray-500 mb-4">{userEmail}</p>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-md">{userEmail}</p>
            </div>

            {profileMessage && (
              <p
                className={`text-sm px-3 py-2 rounded ${
                  profileMessage.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {profileMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2 px-4 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {profileLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Notificações</h2>
          <p className="text-sm text-gray-500 mb-4">Escolha quais eventos geram alertas para você.</p>

          <form onSubmit={handleSaveNotifications} className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
              />
              <span className="text-sm text-gray-700">Receber notificações por email</span>
            </label>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Alertas por evento:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_EVENT_TYPES.map((evt) => (
                  <label key={evt.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledEvents.includes(evt.id)}
                      onChange={() => toggleEvent(evt.id)}
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-600">{evt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {notifMessage && (
              <p
                className={`text-sm px-3 py-2 rounded ${
                  notifMessage.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {notifMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={notifLoading}
              className="w-full py-2 px-4 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {notifLoading ? 'Salvando...' : 'Salvar preferências'}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Alterar senha</h2>
          <p className="text-sm text-gray-500 mb-4">{userEmail}</p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Senha atual
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nova senha
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nova senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900"
                autoComplete="new-password"
              />
            </div>

            {passwordMessage && (
              <p
                className={`text-sm px-3 py-2 rounded ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {passwordMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2 px-4 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {passwordLoading ? 'Alterando...' : 'Alterar senha'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
