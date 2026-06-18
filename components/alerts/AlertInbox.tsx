'use client';

import { useEffect, useState } from 'react';
import type { Alert } from '@/src/types/domain';

interface AlertInboxProps {
  userId: string;
}

export default function AlertInbox({ userId }: AlertInboxProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        const res = await fetch('/api/alerts?unread=true&limit=5', {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          setAlerts(await res.json());
        }
      } catch {
        // Silently fail for badge
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [userId]);

  if (loading) return null;

  if (alerts.length === 0) return null;

  return (
    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
      {alerts.length > 9 ? '9+' : alerts.length}
    </span>
  );
}
