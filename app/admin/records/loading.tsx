import { TableSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-80 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
