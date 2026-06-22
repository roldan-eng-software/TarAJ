import { Skeleton } from '@/components/ui/Skeleton';

export default function AlertsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <Skeleton className="w-32 h-8" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 space-y-2">
            <Skeleton className="w-3/4 h-5" />
            <Skeleton className="w-1/3 h-3" />
            <Skeleton className="w-20 h-5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
