'use client';

interface StateViewsProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
}

export function LoadingState({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export function ErrorState({ message = 'Ocorreu um erro' }: { message?: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-700 text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({ message = 'Nenhum dado disponível' }: { message?: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p>{message}</p>
    </div>
  );
}

export default function StateViews({ loading, error, empty, emptyMessage, loadingMessage }: StateViewsProps) {
  if (loading) return <LoadingState message={loadingMessage} />;
  if (error) return <ErrorState message={error} />;
  if (empty) return <EmptyState message={emptyMessage} />;
  return null;
}
