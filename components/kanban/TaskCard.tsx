'use client';

interface TaskCardProps {
  taskId: string;
  title: string;
  priority: string;
  responsibleUserId: string;
  dueDate?: Date;
  stageId: string;
  onClick?: () => void;
}

export default function TaskCard({
  title,
  priority,
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
      className="bg-white p-3 rounded-lg border cursor-pointer hover:shadow-sm transition"
    >
      <h3 className="font-medium text-sm text-gray-900 truncate">{title}</h3>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[priority] || 'bg-gray-100'}`}>
          {priority}
        </span>
      </div>
      {dueDate && (
        <p className="text-xs text-gray-500 mt-2">
          {new Date(dueDate).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  );
}
