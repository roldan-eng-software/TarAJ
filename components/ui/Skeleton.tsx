'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-gray-200';
  const variantClass = variant === 'circle' ? 'rounded-full' : variant === 'rect' ? 'rounded-lg' : 'rounded h-4';

  return (
    <div
      className={`${baseClass} ${variantClass} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function KanbanCardSkeleton() {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
      <Skeleton className="w-3/4" />
      <Skeleton className="w-1/3" />
      <Skeleton className="w-1/2" />
    </div>
  );
}

export function KanbanColumnSkeleton({ label }: { label: string }) {
  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-lg">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <Skeleton className="w-20" />
          <Skeleton className="w-6 h-5 rounded-full" />
        </div>
      </div>
      <div className="p-2 space-y-2">
        <KanbanCardSkeleton />
        <KanbanCardSkeleton />
        <KanbanCardSkeleton />
      </div>
    </div>
  );
}

export function KanbanBoardSkeleton() {
  const columns = ['Entrada', 'Em análise', 'Aguardando docs', 'Em andamento', 'Em revisão', 'Concluída'];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="w-32 h-8" />
        <Skeleton className="w-28 h-9 rounded-lg" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumnSkeleton key={col} label={col} />
        ))}
      </div>
    </div>
  );
}

export function TaskDetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <Skeleton className="w-48 h-8" />
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <Skeleton className="w-3/4 h-6" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-2/3 h-4" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="w-24 h-8 rounded" />
          <Skeleton className="w-24 h-8 rounded" />
          <Skeleton className="w-24 h-8 rounded" />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <Skeleton className="w-32 h-5" />
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-3/4 h-12" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 pb-2 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="flex-1 h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}
