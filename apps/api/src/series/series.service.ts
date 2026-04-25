import { Injectable, NotFoundException } from "@nestjs/common";
import { Cache } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

const SERIES_INCLUDE = {
  category: true,
  genres: { include: { genre: true } },
  seasons: {
    orderBy: { seasonNumber: "asc" as const },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" as const },
      },
    },
  },
} as const;

function formatSeries(s: any) {
  return {
    ...s,
    genres: s.genres.map((sg: any) => sg.genre),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

@Injectable()
export class SeriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache
  ) {}

  async findAll(filters: {
    q?: string;
    genre?: string;
    category?: string;
    year?: number;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const { q, genre, category, year, page = 1, limit = 20, sort = "newest" } = filters;
    const cacheKey = `series:list:${JSON.stringify(filters)}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const where: Prisma.SeriesWhereInput = {
      ...(q && { title: { contains: q, mode: Prisma.QueryMode.insensitive } }),
      ...(genre && { genres: { some: { genre: { slug: genre } } } }),
      ...(category && { category: { slug: category } }),
      ...(year && { year }),
    };

    const orderBy: Prisma.SeriesOrderByWithRelationInput =
      sort === "trending"
        ? { viewCount: "desc" }
        : sort === "rating"
        ? { imdbRating: "desc" }
        : sort === "oldest"
        ? { createdAt: "asc" }
        : { createdAt: "desc" };

    const [data, total] = await Promise.all([
      this.prisma.series.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          genres: { include: { genre: true } },
          _count: { select: { seasons: true } },
        },
      }),
      this.prisma.series.count({ where }),
    ]);

    const result = {
      data: data.map((s) => ({
        ...s,
        genres: s.genres.map((sg: any) => sg.genre),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cache.set(cacheKey, result, 300000);
    return result;
  }

  async findBySlug(slug: string) {
    const cacheKey = `series:${slug}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const series = await this.prisma.series.findUnique({
      where: { slug },
      include: SERIES_INCLUDE,
    });

    if (!series) throw new NotFoundException("Series not found");

    const result = formatSeries(series);
    await this.cache.set(cacheKey, result, 86400000);
    return result;
  }

  async incrementView(slug: string) {
    await this.prisma.series.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });
    await this.cache.del(`series:${slug}`);
  }

  async trending(limit = 10) {
    const cacheKey = `series:trending:${limit}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const series = await this.prisma.series.findMany({
      orderBy: { viewCount: "desc" },
      take: limit,
      include: {
        category: true,
        genres: { include: { genre: true } },
        _count: { select: { seasons: true } },
      },
    });

    const result = series.map((s) => ({
      ...s,
      genres: s.genres.map((sg: any) => sg.genre),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    await this.cache.set(cacheKey, result, 60000);
    return result;
  }

  async getEpisodeVideoUrl(seriesSlug: string, season: number, episode: number): Promise<string> {
    const ep = await this.prisma.episode.findFirst({
      where: {
        episodeNumber: episode,
        season: {
          seasonNumber: season,
          series: { slug: seriesSlug },
        },
      },
    });
    if (!ep) throw new NotFoundException("Episode not found");
    return ep.videoUrl;
  }

  async incrementEpisodeView(seriesSlug: string, season: number, episode: number) {
    await this.prisma.episode.updateMany({
      where: {
        episodeNumber: episode,
        season: {
          seasonNumber: season,
          series: { slug: seriesSlug },
        },
      },
      data: { viewCount: { increment: 1 } },
    });
  }
}
