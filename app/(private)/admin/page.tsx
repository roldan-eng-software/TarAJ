'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardData {
  activeTasks: number;
  overdueTasks: number;
  unreadAlerts: number;
  activeUsers: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/admin/dashboard', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        setData(json);
      } catch {
        router.push('/kanban');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: 'Tarefas ativas', value: data.activeTasks, color: 'text-sky-600', bg: 'bg-sky-50', href: '/kanban' },
    { label: 'Prazo vencido', value: data.overdueTasks, color: 'text-red-600', bg: 'bg-red-50', href: '/kanban?dueDateStatus=overdue' },
    { label: 'Alertas não lidos', value: data.unreadAlerts, color: 'text-amber-600', bg: 'bg-amber-50', href: '/alerts' },
    { label: 'Usuários ativos', value: data.activeUsers, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/users' },
  ];

  const quickLinks = [
    { label: 'Gerenciar usuários', href: '/admin/users', desc: 'Criar, editar e desativar usuários' },
    { label: 'Auditoria', href: '/admin/audit-logs', desc: 'Consultar logs de eventos críticos' },
    { label: 'Categorias', href: '/admin/categories', desc: 'Gerenciar categorias de tarefas' },
    { label: 'Config. de alertas', href: '/admin/alert-settings', desc: 'Configurar notificações por evento' },
    { label: 'Email Jobs', href: '/admin/email-jobs', desc: 'Acompanhar fila de envio de e-mails' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className={`${card.bg} rounded-lg p-5 border border-transparent hover:border-gray-300 transition cursor-pointer`}>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acesso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="p-4 rounded-lg border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition cursor-pointer">
                <p className="font-medium text-gray-900">{link.label}</p>
                <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
