export function MovieCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="aspect-[2/3] rounded-2xl bg-[rgb(var(--card))]" />
      <div className="h-4 bg-[rgb(var(--card))] rounded-full w-3/4" />
      <div className="h-3 bg-[rgb(var(--card))] rounded-full w-1/2" />
    </div>
  );
}

export function MovieGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="animate-pulse w-full aspect-[21/9] bg-[rgb(var(--card))]" />
  );
}
