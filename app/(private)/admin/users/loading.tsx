import { TableSkeleton } from '@/components/ui/Skeleton';

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-7 w-24 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
      </div>
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}
