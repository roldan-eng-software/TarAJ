'use client';

import { useState, useEffect } from 'react';
import type { TaskCategory } from '@/src/types/domain';

interface TaskFormProps {
  onSubmit?: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  isEditing?: boolean;
}

export interface TaskFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  responsibleUserId: string;
  participantIds: string[];
  dueDate?: string;
  confidentialityLevel: 'interno' | 'restrito' | 'público';
  internalNotes?: string;
}

export default function TaskForm({ onSubmit, initialData, isEditing }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [priority, setPriority] = useState(initialData?.priority || 'normal');
  const [responsibleUserId, setResponsibleUserId] = useState(initialData?.responsibleUserId || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [confidentialityLevel, setConfidentialityLevel] = useState(initialData?.confidentialityLevel || 'interno');
  const [users, setUsers] = useState<{ id: string; displayName: string; email: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        const headers: HeadersInit = token ? { authorization: `Bearer ${token}` } : {};

        const [usersRes, categoriesRes] = await Promise.all([
          fetch('/api/users', { headers }),
          fetch('/api/categories', { headers }),
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
          if (!responsibleUserId && data.users?.length > 0) {
            setResponsibleUserId(data.users[0].id);
          }
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setLoadingUsers(false);
        setLoadingCategories(false);
      }
    };

    fetchInitialData();
  }, [responsibleUserId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      title,
      description,
      category,
      priority,
      responsibleUserId,
      participantIds: [],
      dueDate,
      confidentialityLevel,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="task-title" className="block text-sm font-medium text-gray-900 mb-1">Título</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="task-description" className="block text-sm font-medium text-gray-900 mb-1">Descrição</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="task-category" className="block text-sm font-medium text-gray-900 mb-1">Categoria</label>
          {loadingCategories ? (
            <div className="text-xs text-gray-500 py-2">Carregando categorias...</div>
          ) : (
            <select
              id="task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="" disabled>Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="task-priority" className="block text-sm font-medium text-gray-900 mb-1">Prioridade</label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="crítica">Crítica</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="task-responsible" className="block text-sm font-medium text-gray-900 mb-1">Responsável</label>
        {loadingUsers ? (
          <div className="text-xs text-gray-500 py-2">Carregando usuários...</div>
        ) : (
          <select
            id="task-responsible"
            value={responsibleUserId}
            onChange={(e) => setResponsibleUserId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="" disabled>Selecione um responsável</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName} ({user.email})
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <label htmlFor="task-dueDate" className="block text-sm font-medium text-gray-900 mb-1">Prazo</label>
        <input
          id="task-dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="task-confidentiality" className="block text-sm font-medium text-gray-900 mb-1">Confidencialidade</label>
        <select
          id="task-confidentiality"
          value={confidentialityLevel}
          onChange={(e) => setConfidentialityLevel(e.target.value as TaskFormData['confidentialityLevel'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        >
          <option value="interno">Interno</option>
          <option value="restrito">Restrito</option>
          <option value="público">Público</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isEditing ? 'Atualizar' : 'Criar tarefa'}
      </button>
    </form>
  );
}

