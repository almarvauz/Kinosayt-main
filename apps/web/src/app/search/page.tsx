import { Suspense } from "react";
import { SearchResults } from "@/components/search/search-results";
import { MovieGridSkeleton } from "@/components/ui/skeletons";

interface Props {
  searchParams: { q?: string };
}

export function generateMetadata({ searchParams }: Props) {
  return { title: searchParams.q ? `"${searchParams.q}" qidiruvi` : "Qidirish" };
}

export default function SearchPage({ searchParams }: Props) {
  const query = searchParams.q ?? "";
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {query ? (
          <>
            <span className="text-muted font-normal">Qidiruv: </span>
            &ldquo;{query}&rdquo;
          </>
        ) : (
          "Kino qidirish"
        )}
      </h1>
      <Suspense fallback={<MovieGridSkeleton />}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
