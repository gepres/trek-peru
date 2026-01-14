import { RouteDetailSkeleton } from '@/components/ui/skeleton';

export default function RouteDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="h-16 bg-muted/30 animate-pulse fixed top-0 left-0 right-0 z-50" />

      {/* Route detail skeleton */}
      <RouteDetailSkeleton />
    </div>
  );
}
