import Link from "next/link";
import type { GenreDto } from "@kinosayt/types";
import { cn } from "@/lib/utils";

const GENRE_COLORS: Record<string, string> = {
  "qorqinchli": "bg-purple-500/15 text-purple-400 hover:bg-purple-500/25",
  "fantastika": "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25",
  "drama": "bg-pink-500/15 text-pink-400 hover:bg-pink-500/25",
  "komediya": "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25",
  "jangari": "bg-orange-500/15 text-orange-400 hover:bg-orange-500/25",
};

function color(slug: string) {
  return GENRE_COLORS[slug] ?? "bg-brand-500/10 text-brand-500 hover:bg-brand-500/20";
}

interface Props {
  genre: GenreDto;
  asLink?: boolean;
}

export function GenreBadge({ genre, asLink = true }: Props) {
  const classes = cn(
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors",
    color(genre.slug)
  );

  if (!asLink) return <span className={classes}>{genre.name}</span>;

  return (
    <Link href={`/movies?genre=${genre.slug}`} className={classes}>
      {genre.name}
    </Link>
  );
}
