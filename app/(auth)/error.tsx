'use client';

export default function AuthError({
  error: _error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50" role="alert">
      <div className="text-center max-w-md bg-white p-8 rounded-lg shadow">
        <svg className="mx-auto h-12 w-12 text-red-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Erro na autenticação</h2>
        <p className="text-gray-600 text-sm mb-4">
          Ocorreu um erro inesperado. Tente recarregar a página.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition cursor-pointer"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            Ir para o login
          </button>
        </div>
      </div>
    </div>
  );
}
