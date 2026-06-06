import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GridLoader } from "@/components/grid-loader";

export default function TestLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-8 w-28" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-3 w-80 max-w-full" />
      </div>
      <Card>
        <CardContent className="flex min-h-72 items-center justify-center py-12">
          <GridLoader label="Preparing your test…" />
        </CardContent>
      </Card>
    </div>
  );
}
