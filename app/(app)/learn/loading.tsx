import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function LearnLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  );
}
