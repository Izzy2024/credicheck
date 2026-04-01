import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card dark:bg-gray-900 border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32 mt-1" />
            </div>
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 dark:bg-gray-800">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </main>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-40 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 dark:bg-gray-800">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <TableSkeleton rows={5} cols={8} />
      </main>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b p-4">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Skeleton className="h-8 w-48 mx-auto mb-6" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full mt-4" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
        <div className="space-y-3 mt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-40 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="rounded-lg border p-6 space-y-6 dark:bg-gray-800">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="flex gap-4 pt-6">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-24" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function FoundResultsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-40 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="rounded-lg border p-6 space-y-4 dark:bg-gray-800">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border p-6 space-y-4 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Skeleton className="h-6 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function NotFoundResultsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-40 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="rounded-lg border p-8 text-center mb-8 dark:bg-gray-800">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
          <Skeleton className="h-6 w-48 mx-auto mb-3" />
          <Skeleton className="h-4 w-64 mx-auto mb-6" />
          <Skeleton className="h-8 w-40 mx-auto" />
        </div>
        <div className="rounded-lg border p-6 dark:bg-gray-800">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 dark:bg-gray-800">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border p-6 dark:bg-gray-800">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="rounded-lg border p-6 dark:bg-gray-800">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="rounded-lg border p-6 space-y-6 dark:bg-gray-800">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export function AddRecordSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="space-y-8">
          <div className="rounded-lg border p-6 space-y-4 dark:bg-gray-800">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-6 space-y-4 dark:bg-gray-800">
            <Skeleton className="h-6 w-56 mb-2" />
            <Skeleton className="h-4 w-56" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </main>
    </div>
  );
}
