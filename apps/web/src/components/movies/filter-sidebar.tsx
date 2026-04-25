"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FilterSidebar() {
  const router = useRouter();
  const params = useSearchParams();

  const { data: genres } = useQuery({
    queryKey: ["genres"],
    queryFn: () => fetch(`/api/genres`).then((r) => r.json()),
    staleTime: 3600000,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetch(`/api/categories`).then((r) => r.json()),
    staleTime: 3600000,
  });

  function buildLink(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (p.get(key) === value) p.delete(key);
    else { p.set(key, value); p.delete("page"); }
    return `/movies?${p.toString()}`;
  }

  const activeGenre = params.get("genre");
  const activeCategory = params.get("category");

  const years = [2024, 2023, 2022, 2021, 2020, 2019, 2018];

  return (
    <div className="space-y-6 sticky top-24">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Janrlar</h3>
        <div className="flex flex-col gap-1">
          {genres?.map((g: { id: number; name: string; slug: string; _count?: { movies: number } }) => (
            <Link
              key={g.id}
              href={buildLink("genre", g.slug)}
              className={cn(
                "flex items-center justify-between px-3 py-1.5 rounded-xl text-sm transition-colors",
                activeGenre === g.slug
                  ? "bg-brand-500 text-white"
                  : "hover:bg-[rgb(var(--card))]"
              )}
            >
              <span>{g.name}</span>
              {g._count && <span className="text-xs opacity-60">{g._count.movies}</span>}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Kategoriya</h3>
        <div className="flex flex-col gap-1">
          {categories?.map((c: { id: number; name: string; slug: string }) => (
            <Link
              key={c.id}
              href={buildLink("category", c.slug)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm transition-colors",
                activeCategory === c.slug
                  ? "bg-brand-500 text-white"
                  : "hover:bg-[rgb(var(--card))]"
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Yil</h3>
        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <Link
              key={y}
              href={buildLink("year", String(y))}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors border",
                params.get("year") === String(y)
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "border-base hover:border-brand-500 hover:text-brand-500"
              )}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
