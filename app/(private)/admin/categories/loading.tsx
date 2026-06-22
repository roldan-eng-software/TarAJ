import { Skeleton } from '@/components/ui/Skeleton';

export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-7 w-32 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 w-56 bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="bg-white rounded-lg border divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="flex-1 h-5" />
            <Skeleton className="w-16 h-5 rounded" />
            <Skeleton className="w-20 h-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
