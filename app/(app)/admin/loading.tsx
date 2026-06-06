import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, StatCardsSkeleton } from "@/components/skeletons";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={3} className="grid gap-4 sm:grid-cols-3" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
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
