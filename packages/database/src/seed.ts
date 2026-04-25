import { PrismaClient } from "@prisma/client";
import moviesData from "../../../movies.json";

const prisma = new PrismaClient();

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface RawMovie {
  id: number;
  title: string;
  videoUrl: string;
  poster: string;
  category: string;
  year: string;
  description: string;
  genre: string;
  is_premiere: boolean;
  premiere_until: string | null;
  created_at: string;
}

async function main() {
  const movies = moviesData as RawMovie[];

  const uniqueCategories = [...new Set(movies.map((m) => m.category))];
  const uniqueGenres = [...new Set(movies.map((m) => m.genre))];

  const categoryMap = new Map<string, number>();
  for (const name of uniqueCategories) {
    const cat = await prisma.category.upsert({
      where: { slug: toSlug(name) },
      update: {},
      create: { name, slug: toSlug(name) },
    });
    categoryMap.set(name, cat.id);
  }

  const genreMap = new Map<string, number>();
  for (const name of uniqueGenres) {
    const genre = await prisma.genre.upsert({
      where: { slug: toSlug(name) },
      update: {},
      create: { name, slug: toSlug(name) },
    });
    genreMap.set(name, genre.id);
  }

  let created = 0;
  let updated = 0;

  for (const raw of movies) {
    const slug = toSlug(raw.title);
    const categoryId = categoryMap.get(raw.category);
    const genreId = genreMap.get(raw.genre);

    const existing = await prisma.movie.findUnique({
      where: { externalId: raw.id },
    });

    if (existing) {
      await prisma.movie.update({
        where: { externalId: raw.id },
        data: {
          title: raw.title,
          videoUrl: raw.videoUrl,
          posterUrl: raw.poster,
          year: parseInt(raw.year),
          isPremiere: raw.is_premiere,
          premiereUntil: raw.premiere_until ? new Date(raw.premiere_until) : null,
          categoryId,
        },
      });
      updated++;
    } else {
      const uniqueSlug = await ensureUniqueSlug(slug);
      await prisma.movie.create({
        data: {
          externalId: raw.id,
          title: raw.title,
          slug: uniqueSlug,
          videoUrl: raw.videoUrl,
          posterUrl: raw.poster,
          year: parseInt(raw.year),
          isPremiere: raw.is_premiere,
          premiereUntil: raw.premiere_until ? new Date(raw.premiere_until) : null,
          categoryId,
          genres: genreId
            ? {
                create: [{ genreId }],
              }
            : undefined,
        },
      });
      created++;
    }
  }

  console.log(`Seed complete: ${created} created, ${updated} updated`);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (await prisma.movie.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
