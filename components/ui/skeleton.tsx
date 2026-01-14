import { cn } from "@/lib/utils/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Skeleton para cards de rutas
function RouteCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

// Skeleton para lista de rutas
function RouteListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <RouteCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Skeleton para detalle de ruta
function RouteDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <Skeleton className="h-[50vh] min-h-[400px] w-full" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton para avatar
function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14"
  }
  return <Skeleton className={cn("rounded-full", sizes[size])} />
}

// Skeleton para texto
function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  )
}

// Skeleton para imagen de galería
function ImageSkeleton({ aspectRatio = "video" }: { aspectRatio?: "video" | "square" }) {
  return (
    <Skeleton
      className={cn(
        "w-full",
        aspectRatio === "video" ? "aspect-video" : "aspect-square"
      )}
    />
  )
}

// Skeleton para stats
function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <Skeleton className="h-8 w-8 rounded-full mx-auto" />
          <Skeleton className="h-6 w-12 mx-auto" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      ))}
    </div>
  )
}

export {
  Skeleton,
  RouteCardSkeleton,
  RouteListSkeleton,
  RouteDetailSkeleton,
  AvatarSkeleton,
  TextSkeleton,
  ImageSkeleton,
  StatsSkeleton
}
