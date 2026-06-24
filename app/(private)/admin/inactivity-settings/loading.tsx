export default function InactivitySettingsLoading() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-64" />
        <div className="h-4 bg-gray-200 animate-pulse rounded w-96" />
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="h-6 bg-gray-200 animate-pulse rounded w-48" />
          <div className="h-10 bg-gray-200 animate-pulse rounded w-32" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-full" />
        </div>
      </div>
    </div>
  );
}
