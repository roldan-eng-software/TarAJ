'use client';

import { useState } from 'react';

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
  confidentialityLevel: string;
  internalNotes?: string;
}

export default function TaskForm({ onSubmit, initialData, isEditing }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [priority, setPriority] = useState(initialData?.priority || 'normal');
  const [responsibleUserId, setResponsibleUserId] = useState(initialData?.responsibleUserId || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');

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
      confidentialityLevel: 'padrão',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Categoria</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Prioridade</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
          >
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="crítica">Crítica</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Responsável</label>
        <input
          type="text"
          value={responsibleUserId}
          onChange={(e) => setResponsibleUserId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Prazo</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition"
      >
        {isEditing ? 'Atualizar' : 'Criar tarefa'}
      </button>
    </form>
  );
}
