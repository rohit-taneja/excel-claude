import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Shared skeleton building blocks used by route-level `loading.tsx` files so
 * navigations show a layout-matched placeholder while server data streams in.
 */

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

/** A row of compact stat tiles, as seen on the dashboard and reports pages. */
export function StatCardsSkeleton({
  count = 4,
  className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** A grid of taller content cards, as seen on learn/practice/tests lists. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** A list of label + bar rows, as seen in skill-mastery panels. */
export function BarListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
