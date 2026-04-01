import { TableSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
