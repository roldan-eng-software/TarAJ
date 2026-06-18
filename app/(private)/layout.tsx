import type { ReactNode } from 'react';

export default function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-slate-800 text-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Sistema Jurídico
          </h2>
          <div className="space-x-4">
            <a href="/kanban" className="hover:text-sky-400">
              Kanban
            </a>
            <a href="/alerts" className="hover:text-sky-400">
              Alertas
            </a>
            <a href="/archive" className="hover:text-sky-400">
              Arquivo
            </a>
            <a href="/" className="hover:text-sky-400">
              Sair
            </a>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
