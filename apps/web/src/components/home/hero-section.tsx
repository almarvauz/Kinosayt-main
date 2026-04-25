import { HeroCarousel } from "./hero-carousel";
import type { MovieDto } from "@kinosayt/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function HeroSection() {
  let pool: MovieDto[] = [];
  try {
    // cache: 'no-store' — bypass Next.js data cache so movies differ on every request
    const res = await fetch(`${BASE}/movies/trending`, { cache: "no-store" });
    if (res.ok) pool = await res.json();
  } catch {
    return null;
  }

  if (!pool.length) return null;

  // Pick 3 random movies from the pool
  const featured = shuffle(pool).slice(0, 3);

  return <HeroCarousel movies={featured} />;
}
