"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { MovieCard } from "./movie-card";
import { MovieGridSkeleton } from "@/components/ui/skeletons";

async function fetchMovies(params: URLSearchParams, page: number) {
  const p = new URLSearchParams(params);
  p.set("page", String(page));
  p.set("limit", "20");
  const res = await fetch(`/api/movies?${p.toString()}`);
  if (!res.ok) throw new Error("Failed to load movies");
  return res.json();
}

export function MoviesGrid() {
  const searchParams = useSearchParams();
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["movies", searchParams.toString()],
      queryFn: ({ pageParam = 1 }) => fetchMovies(searchParams, pageParam as number),
      getNextPageParam: (last) =>
        last.page < last.totalPages ? last.page + 1 : undefined,
      initialPageParam: 1,
    });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <MovieGridSkeleton />;

  const movies = data?.pages.flatMap((p) => p.data) ?? [];

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted">
        <p className="text-lg font-medium">Kino topilmadi</p>
        <p className="text-sm mt-1">Boshqa kalit so&apos;zlar bilan urinib ko&apos;ring</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
      <div ref={loaderRef} className="mt-8 pb-12">
        {isFetchingNextPage && <MovieGridSkeleton count={5} />}
      </div>
    </>
  );
}
