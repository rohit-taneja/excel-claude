import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarListSkeleton,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-40" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-40" />
              </CardContent>
            </Card>
          </div>
          <BarListSkeleton rows={4} />
        </div>
        <BarListSkeleton rows={5} />
      </div>
    </div>
  );
}
