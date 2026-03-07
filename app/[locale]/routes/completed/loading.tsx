import { RouteListSkeleton } from '@/components/ui/skeleton';

export default function CompletedRoutesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-muted/30 animate-pulse" />
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-24 pb-8">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="flex gap-8">
          <div className="hidden lg:block w-72 shrink-0">
            <div className="h-96 bg-muted rounded-2xl animate-pulse" />
          </div>
          <div className="flex-1">
            <RouteListSkeleton count={6} />
          </div>
        </div>
      </div>
    </div>
  );
}
