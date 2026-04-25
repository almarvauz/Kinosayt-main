import { Injectable } from "@nestjs/common";
import { Cache } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { PrismaService } from "../prisma/prisma.service";
import type { GenreDto } from "@kinosayt/types";

@Injectable()
export class GenresService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache
  ) {}

  async findAll(): Promise<GenreDto[]> {
    const cacheKey = "genres:all";
    const cached = await this.cache.get<GenreDto[]>(cacheKey);
    if (cached) return cached;

    const genres = await this.prisma.genre.findMany({
      include: { _count: { select: { movies: true } } },
      orderBy: { name: "asc" },
    });

    const result: GenreDto[] = genres.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      _count: { movies: g._count.movies },
    }));

    await this.cache.set(cacheKey, result, 3600000);
    return result;
  }
}
