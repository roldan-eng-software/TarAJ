import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Sistema Jurídico - AJ Regional',
  description: 'Acompanhamento de tarefas jurídicas em Kanban',
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
