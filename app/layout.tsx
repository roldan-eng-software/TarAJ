import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Sistema Kanban',
  description: 'Acompanhamento de tarefas',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
