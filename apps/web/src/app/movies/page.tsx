import { Suspense } from "react";
import { MoviesGrid } from "@/components/movies/movies-grid";
import { FilterSidebar } from "@/components/movies/filter-sidebar";
import { MovieGridSkeleton } from "@/components/ui/skeletons";

export const metadata = { title: "Kinolar" };

export default function MoviesPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Suspense fallback={null}>
            <FilterSidebar />
          </Suspense>
        </aside>
        <div className="flex-1 min-w-0">
          <Suspense fallback={<MovieGridSkeleton />}>
            <MoviesGrid />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
