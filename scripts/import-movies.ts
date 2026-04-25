import { PrismaClient } from "../packages/database/node_modules/@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .substring(0, 100);
}

async function main() {
  const filePath = join(process.cwd(), "movies.json");
  const raw = readFileSync(filePath, "utf-8");
  const movies = JSON.parse(raw);

  console.log(`📦 Jami ${movies.length} ta kino topildi. Import boshlanmoqda...`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const m of movies) {
    try {
      // Category yaratish yoki topish
      let categoryId: number | null = null;
      if (m.category) {
        const catSlug = slugify(m.category);
        const cat = await prisma.category.upsert({
          where: { slug: catSlug },
          update: {},
          create: { name: m.category, slug: catSlug },
        });
        categoryId = cat.id;
      }

      // Genre yaratish yoki topish
      let genreId: number | null = null;
      if (m.genre) {
        const genreSlug = slugify(m.genre);
        const genre = await prisma.genre.upsert({
          where: { slug: genreSlug },
          update: {},
          create: { name: m.genre, slug: genreSlug },
        });
        genreId = genre.id;
      }

      // Yil - string yoki null bo'lishi mumkin
      const year = m.year ? parseInt(m.year.toString()) : new Date().getFullYear();
      const validYear = isNaN(year) ? new Date().getFullYear() : year;

      // Unique slug yaratish (externalId bilan)
      const baseSlug = slugify(m.title) || `movie-${m.id}`;
      const slug = `${baseSlug}-${m.id}`;

      // Movie yaratish
      const movie = await prisma.movie.upsert({
        where: { externalId: m.id },
        update: {},
        create: {
          externalId: m.id,
          title: m.title,
          slug: slug,
          videoUrl: m.videoUrl || "",
          posterUrl: m.poster || "",
          year: validYear,
          isPremiere: m.is_premiere || false,
          premiereUntil: m.premiere_until ? new Date(m.premiere_until) : null,
          categoryId: categoryId,
          createdAt: m.created_at ? new Date(m.created_at) : new Date(),
        },
      });

      // Genre bog'lash
      if (genreId) {
        await prisma.movieGenre.upsert({
          where: { movieId_genreId: { movieId: movie.id, genreId } },
          update: {},
          create: { movieId: movie.id, genreId },
        });
      }

      success++;
      if (success % 100 === 0) {
        console.log(`✅ ${success} ta kino import qilindi...`);
      }
    } catch (e: any) {
      if (e.code === "P2002") {
        skipped++;
      } else {
        failed++;
        if (failed < 5) console.error(`❌ Xato (id=${m.id}):`, e.message);
      }
    }
  }

  console.log(`\n🎉 Import yakunlandi!`);
  console.log(`✅ Muvaffaqiyatli: ${success}`);
  console.log(`⏭️  O'tkazib yuborilgan: ${skipped}`);
  console.log(`❌ Xatolik: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
