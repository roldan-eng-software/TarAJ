import { Skeleton } from '@/components/ui/Skeleton';

export default function ArchiveLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <Skeleton className="w-56 h-8" />
      <Skeleton className="w-full h-10 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 space-y-3">
            <Skeleton className="w-3/4 h-5" />
            <Skeleton className="w-1/2 h-4" />
            <div className="flex gap-2">
              <Skeleton className="w-16 h-5 rounded" />
              <Skeleton className="w-16 h-5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
