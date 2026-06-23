'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { RoleId } from '@/src/types/domain';
import AlertBadge from '@/components/alerts/AlertInbox';

export default function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userRole, setUserRole] = useState<RoleId | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include',
        });

        if (!res.ok) {
          router.push('/login');
          return;
        }

        const session = await res.json();
        setUserRole(session.roleId || null);
        setUserId(session.uid || null);
        setAuthenticated(true);
      } catch {
        router.push('/login');
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-64">
          <div className="h-8 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const isAdmin = userRole === 'administrator';

  const navLinks = [
    { href: '/kanban', label: 'Kanban' },
    { href: '/alerts', label: 'Alertas', showBadge: true },
    { href: '/archive', label: 'Arquivo' },
    { href: '/settings', label: 'Config' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }, { href: '/admin/users', label: 'Usuários' }, { href: '/admin/audit-logs', label: 'Auditoria' }, { href: '/admin/email-jobs', label: 'Email Jobs' }, { href: '/admin/alert-settings', label: 'Alertas' }, { href: '/admin/categories', label: 'Categorias' }] : []),
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-800 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/kanban" className="text-lg font-semibold hover:text-sky-400 transition">
            Sistema Jurídico
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  pathname === link.href || pathname?.startsWith(link.href + '/')
                    ? 'bg-slate-700 text-sky-400'
                    : 'hover:bg-slate-700 hover:text-sky-400'
                }`}
              >
                {link.label}
                {link.showBadge && userId && <AlertBadge userId={userId} />}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-700 hover:text-sky-400 transition cursor-pointer"
            >
              Sair
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 rounded hover:bg-slate-700 transition"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 pt-2 border-t border-slate-700 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative block px-3 py-2 rounded-md text-sm font-medium transition ${
                  pathname === link.href || pathname?.startsWith(link.href + '/')
                    ? 'bg-slate-700 text-sky-400'
                    : 'hover:bg-slate-700'
                }`}
              >
                {link.label}
                {link.showBadge && userId && <AlertBadge userId={userId} />}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition cursor-pointer"
            >
              Sair
            </button>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
