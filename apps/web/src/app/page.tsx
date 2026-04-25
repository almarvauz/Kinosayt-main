import { HeroSection } from "@/components/home/hero-section";
import { TrendingRow } from "@/components/home/trending-row";
import { GenreRows } from "@/components/home/genre-rows";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        <TrendingRow />
        <GenreRows />
      </div>
    </>
  );
}
