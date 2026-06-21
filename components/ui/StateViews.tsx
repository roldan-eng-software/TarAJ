'use client';

interface LoadingStateProps {
  message?: string;
  align?: 'center' | 'left';
}

export function LoadingState({ message = 'Carregando...', align = 'center' }: LoadingStateProps) {
  return (
    <div className={`flex items-center ${align === 'left' ? 'justify-start' : 'justify-center'} py-12`} role="status" aria-live="polite">
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  align?: 'center' | 'left';
}

export function ErrorState({ message = 'Ocorreu um erro', onRetry, align = 'center' }: ErrorStateProps) {
  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${align === 'center' ? 'text-center' : ''}`} role="alert">
      <p className="text-red-700 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  message?: string;
  align?: 'center' | 'left';
}

export function EmptyState({ message = 'Nenhum dado disponível', align = 'center' }: EmptyStateProps) {
  return (
    <div className={`${align === 'center' ? 'text-center' : ''} py-12 text-gray-500`} role="status" aria-live="polite">
      <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p>{message}</p>
    </div>
  );
}

interface StateViewsProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  onRetry?: () => void;
  align?: 'center' | 'left';
}

export default function StateViews({ loading, error, empty, emptyMessage, loadingMessage, onRetry, align }: StateViewsProps) {
  if (loading) return <LoadingState message={loadingMessage} align={align} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} align={align} />;
  if (empty) return <EmptyState message={emptyMessage} align={align} />;
  return null;
}
