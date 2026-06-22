import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-slate-800 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Página não encontrada</h2>
        <p className="text-gray-600 text-sm mb-6">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/kanban"
          className="inline-block px-5 py-2.5 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
        >
          Ir para o Kanban
        </Link>
      </div>
    </div>
  );
}
