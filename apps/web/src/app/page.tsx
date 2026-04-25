import { HeroSection } from "@/components/home/hero-section";
import { TrendingRow } from "@/components/home/trending-row";
import { SeriesTrendingRow } from "@/components/home/series-trending-row";
import { MultfilmTrendingRow } from "@/components/home/multfilm-trending-row";
import { GenreRows } from "@/components/home/genre-rows";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        <TrendingRow />
        <SeriesTrendingRow />
        <MultfilmTrendingRow />
        <GenreRows />
      </div>
    </>
  );
}
