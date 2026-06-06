import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GridLoader } from "@/components/grid-loader";

export default function PracticeSkillLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-8 w-28" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center py-12">
          <GridLoader label="Loading questions…" />
        </CardContent>
      </Card>
    </div>
  );
}
