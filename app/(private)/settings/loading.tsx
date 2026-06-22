import { Skeleton } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <Skeleton className="w-32 h-8" />
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <Skeleton className="w-48 h-5" />
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-32 h-9 rounded-lg" />
      </div>
    </div>
  );
}
