'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          document.cookie = 'token=; path=/; max-age=0';
          router.push('/login');
          return;
        }

        setAuthenticated(true);
      } catch {
        router.push('/login');
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Verificando autenticação...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-slate-800 text-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Sistema Jurídico
          </h2>
          <div className="space-x-4 flex items-center">
            <a href="/kanban" className="hover:text-sky-400">
              Kanban
            </a>
            <a href="/alerts" className="hover:text-sky-400">
              Alertas
            </a>
            <a href="/archive" className="hover:text-sky-400">
              Arquivo
            </a>
            <button
              onClick={() => {
                document.cookie = 'token=; path=/; max-age=0';
                router.push('/login');
              }}
              className="hover:text-sky-400 cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
