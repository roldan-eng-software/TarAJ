'use client';

interface TaskCardProps {
  taskId: string;
  title: string;
  priority: string;
  responsibleUserId: string;
  responsiblePersonName?: string;
  dueDate?: Date;
  stageId: string;
  onClick?: () => void;
}

export default function TaskCard({
  title,
  priority,
  responsiblePersonName,
  dueDate,
  onClick,
}: TaskCardProps) {
  const priorityColors: Record<string, string> = {
    baixa: 'bg-gray-100 text-gray-700',
    média: 'bg-blue-100 text-blue-700',
    alta: 'bg-amber-100 text-amber-700',
    crítica: 'bg-red-100 text-red-700',
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      tabIndex={0}
      role="button"
      aria-label={'Abrir tarefa: ' + title}
      title={title}
      className="bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-transform focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      <h3 className="font-medium text-sm text-gray-900 truncate">{title}</h3>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[priority] || 'bg-gray-100'}`}>
          {priority}
        </span>
      </div>
      {responsiblePersonName && (
        <p className="text-xs text-gray-600 mt-2 truncate">
          👤 {responsiblePersonName}
        </p>
      )}
      {dueDate && (
        <p className="text-xs text-gray-500 mt-2">
          {new Date(dueDate).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  );
}
