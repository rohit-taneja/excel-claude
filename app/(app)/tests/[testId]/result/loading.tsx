import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarListSkeleton } from "@/components/skeletons";

export default function TestResultLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-52" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarListSkeleton rows={5} />
        <BarListSkeleton rows={3} />
      </div>
    </div>
  );
}
