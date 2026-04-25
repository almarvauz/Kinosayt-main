import { Controller, Get, Query, Post, HttpCode, HttpStatus } from "@nestjs/common";

import { SearchService } from "./search.service";
import { PrismaService } from "../prisma/prisma.service";

const MOVIE_INCLUDE = {
  category: true,
  genres: { include: { genre: true } },
} as const;

function fmt(m: any) {
  return {
    ...m,
    genres: m.genres.map((mg: any) => mg.genre),
    createdAt: m.createdAt.toISOString(),
    premiereUntil: m.premiereUntil?.toISOString() ?? null,
  };
}

@Controller("search")
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async search(
    @Query("q") q: string = "",
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
    @Query("genre") genre?: string,
    @Query("year") year?: string,
    @Query("sort") sort: string = "relevance"
  ) {
    if (!q || q.trim().length < 1) {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }

    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit) || 20));

    const { ids, total } = await this.searchService.search(q, p, l, {
      genre,
      year: year ? parseInt(year) : undefined,
      sort,
    });

    if (ids.length > 0) {
      // Fetch full movie data from Postgres in original ES order
      const movies = await this.prisma.movie.findMany({
        where: { id: { in: ids } },
        include: MOVIE_INCLUDE,
      });
      const movieMap = new Map(movies.map((m) => [m.id, m]));
      const ordered = ids.map((id) => movieMap.get(id)).filter(Boolean);
      return {
        data: ordered.map(fmt),
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      };
    }

    // Prisma fallback (ES unavailable or no results)
    const where: any = q.startsWith("tt") 
      ? { imdbId: q } 
      : { title: { contains: q, mode: "insensitive" } };
    if (genre) where.genres = { some: { genre: { name: genre } } };
    if (year) where.year = parseInt(year as any);

    const [movies, count] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        include: MOVIE_INCLUDE,
        skip: (p - 1) * l,
        take: l,
        orderBy: sort === "newest" ? { id: "desc" } : sort === "rating" ? { imdbRating: "desc" } : sort === "trending" ? { viewCount: "desc" } : { title: "asc" },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return {
      data: movies.map(fmt),
      total: count,
      page: p,
      limit: l,
      totalPages: Math.ceil(count / l),
    };
  }

  @Post("reindex")
  @HttpCode(HttpStatus.ACCEPTED)
  async reindex() {
    // Fire and forget
    this.searchService.syncAll().catch(() => {});
    return { message: "Reindex started in background" };
  }
}
