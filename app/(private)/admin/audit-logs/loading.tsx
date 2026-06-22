import { TableSkeleton } from '@/components/ui/Skeleton';

export default function AuditLogsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-7 w-32 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
