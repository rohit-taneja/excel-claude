import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkillLessonLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-8 w-28" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-56" />
        </div>
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
