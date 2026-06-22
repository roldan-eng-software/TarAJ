'use client';

export default function PrivateError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4" role="alert">
      <div className="text-center max-w-md">
        <svg className="mx-auto h-12 w-12 text-red-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado</h2>
        <p className="text-gray-600 text-sm mb-4">
          Ocorreu um erro inesperado. Tente recarregar a página ou voltar ao início.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition cursor-pointer"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.href = '/kanban'}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            Ir para o Kanban
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-400 cursor-pointer">Detalhes do erro</summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-red-700 overflow-auto max-h-40">
              {error.message}{error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
