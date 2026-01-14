import { RouteListSkeleton } from '@/components/ui/skeleton';

export default function RoutesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="h-16 bg-muted/30 animate-pulse" />

      {/* Hero skeleton */}
      <div className="relative h-[40vh] bg-gradient-to-br from-primary/10 to-background animate-pulse" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters skeleton */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-40 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 flex-1 max-w-xs bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Route cards skeleton */}
        <RouteListSkeleton count={6} />
      </div>
    </div>
  );
}
