import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarListSkeleton,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={3} className="grid gap-4 sm:grid-cols-3" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BarListSkeleton rows={6} />
        </div>
        <BarListSkeleton rows={3} />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
