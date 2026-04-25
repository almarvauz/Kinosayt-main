import { Injectable, NotFoundException } from "@nestjs/common";
import { Cache } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { PrismaService } from "../prisma/prisma.service";
import { GetMoviesDto } from "./dto/get-movies.dto";
import type { PaginatedMovies, MovieDto } from "@kinosayt/types";
import { Prisma } from "@prisma/client";

const MOVIE_INCLUDE = {
  category: true,
  genres: { include: { genre: true } },
} as const;

function formatMovie(m: any): MovieDto {
  const { code, ...rest } = m;
  return {
    ...rest,
    genres: m.genres.map((mg: any) => mg.genre),
    createdAt: m.createdAt.toISOString(),
    premiereUntil: m.premiereUntil?.toISOString() ?? null,
  };
}

@Injectable()
export class MoviesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache
  ) {}

  async findAll(dto: GetMoviesDto): Promise<PaginatedMovies> {
    const { q, genre, category, year, page = 1, limit = 20, sort = "newest" } = dto;
    const cacheKey = `movies:${JSON.stringify(dto)}`;
    const cached = await this.cache.get<PaginatedMovies>(cacheKey);
    if (cached) return cached;

    const where: Prisma.MovieWhereInput = {
      ...(q && {
        title: { contains: q, mode: Prisma.QueryMode.insensitive },
      }),
      ...(genre && { genres: { some: { genre: { slug: genre } } } }),
      ...(category && { category: { slug: category } }),
      ...(year && { year }),
    };

    const orderBy: Prisma.MovieOrderByWithRelationInput =
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "trending"
        ? { viewCount: "desc" }
        : sort === "rating"
        ? { imdbRating: "desc" }
        : { createdAt: "desc" };

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: MOVIE_INCLUDE,
      }),
      this.prisma.movie.count({ where }),
    ]);

    const result: PaginatedMovies = {
      data: data.map(formatMovie),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cache.set(cacheKey, result, 300000);
    return result;
  }

  async findBySlug(slug: string): Promise<MovieDto> {
    const cacheKey = `movie:${slug}`;
    const cached = await this.cache.get<MovieDto>(cacheKey);
    if (cached) return cached;

    const movie = await this.prisma.movie.findUnique({
      where: { slug },
      include: MOVIE_INCLUDE,
    });

    if (!movie) throw new NotFoundException("Movie not found");

    const result = formatMovie(movie);
    await this.cache.set(cacheKey, result, 86400000);
    return result;
  }

  async incrementView(slug: string): Promise<void> {
    await this.prisma.movie.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });
    await this.cache.del(`movie:${slug}`);
  }

  async setCode(slug: string, code: string | null): Promise<MovieDto> {
    const movie = await this.prisma.movie.update({
      where: { slug },
      data: { code: code || null },
      include: MOVIE_INCLUDE,
    });
    await this.cache.del(`movie:${slug}`);
    return formatMovie(movie);
  }

  async getRawCode(slug: string): Promise<string | null> {
    const movie = await this.prisma.movie.findUnique({
      where: { slug },
      select: { code: true },
    });
    if (!movie) throw new NotFoundException("Movie not found");
    return movie.code;
  }

  async trending(limit = 10): Promise<MovieDto[]> {
    const cacheKey = `trending:${limit}`;
    const cached = await this.cache.get<MovieDto[]>(cacheKey);
    if (cached) return cached;

    const movies = await this.prisma.movie.findMany({
      orderBy: { viewCount: "desc" },
      take: limit,
      include: MOVIE_INCLUDE,
    });

    const result = movies.map(formatMovie);
    await this.cache.set(cacheKey, result, 60000);
    return result;
  }

  async findForBot(query: string, page = 1): Promise<{ movies: MovieDto[]; total: number }> {
    const limit = 5;
    const where: Prisma.MovieWhereInput = {
      title: { contains: query, mode: Prisma.QueryMode.insensitive },
    };

    const [movies, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: MOVIE_INCLUDE,
        orderBy: { viewCount: "desc" },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return { movies: movies.map(formatMovie), total };
  }

  async findByCode(code: string, page = 1): Promise<{ movies: MovieDto[]; total: number }> {
    const limit = 5;
    const where: Prisma.MovieWhereInput = {
      code: { contains: code, mode: Prisma.QueryMode.insensitive },
    };

    const [movies, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: MOVIE_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return { movies: movies.map(formatMovie), total };
  }

  /**
   * Detect available quality variants for a movie's video URL.
   * Probes HEAD requests in parallel and caches result for 24h.
   */
  async getQualities(slug: string): Promise<{
    qualities: { quality: number; url: string; label: string }[];
    defaultQuality: number;
  }> {
    const cacheKey = `qualities:${slug}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const movie = await this.prisma.movie.findUnique({ where: { slug } });
    if (!movie) throw new NotFoundException("Movie not found");

    const videoUrl = movie.videoUrl;

    // Detect quality suffix pattern: _720.mp4, _480.mp4, etc.
    const qualityMatch = videoUrl.match(/_(\d+)\.mp4$/i);
    const QUALITY_LEVELS = [
      { quality: 360, label: "360p" },
      { quality: 480, label: "480p" },
      { quality: 720, label: "720p" },
      { quality: 1080, label: "1080p" },
    ];

    let qualities: { quality: number; url: string; label: string }[] = [];

    if (qualityMatch) {
      const currentQuality = parseInt(qualityMatch[1]);
      const baseUrl = videoUrl.replace(/_\d+\.mp4$/i, "");

      // Probe all variants in parallel with HEAD requests (3s timeout)
      const probes = QUALITY_LEVELS.map(async ({ quality, label }) => {
        const url = `${baseUrl}_${quality}.mp4`;
        if (quality === currentQuality) {
          return { quality, url, label, exists: true };
        }
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (compatible; Kinosayt/1.0)" },
          });
          clearTimeout(timeout);
          return { quality, url, label, exists: res.ok };
        } catch {
          return { quality, url, label, exists: false };
        }
      });

      const results = await Promise.all(probes);
      qualities = results
        .filter((r) => r.exists)
        .map(({ quality, url, label }) => ({ quality, url, label }))
        .sort((a, b) => a.quality - b.quality);
    }

    // Fallback: at minimum include the original URL
    if (qualities.length === 0) {
      const fallbackQ = qualityMatch ? parseInt(qualityMatch[1]) : 720;
      qualities = [{ quality: fallbackQ, url: videoUrl, label: `${fallbackQ}p` }];
    }

    // Default to highest available ≤ 720
    const defaultQuality =
      qualities.filter((q) => q.quality <= 720).pop()?.quality ??
      qualities[0].quality;

    const result = { qualities, defaultQuality };
    await this.cache.set(cacheKey, result, 86400000); // 24h
    return result;
  }
  async adminCreate(body: {
    title: string;
    slug: string;
    year: number;
    posterUrl: string;
    videoUrl: string;
    imdbId?: string;
    categorySlug?: string;
    genres?: string[];
    isPremiere?: boolean;
  }) {
    // Resolve or create category
    let categoryId: number | undefined;
    if (body.categorySlug) {
      const cat = await this.prisma.category.upsert({
        where: { slug: body.categorySlug },
        update: {},
        create: {
          slug: body.categorySlug,
          name: body.categorySlug.charAt(0).toUpperCase() + body.categorySlug.slice(1),
        },
      });
      categoryId = cat.id;
    }

    // Determine next externalId
    const last = await this.prisma.movie.findFirst({ orderBy: { externalId: "desc" } });
    const externalId = (last?.externalId ?? 0) + 1;

    // Create movie
    const movie = await this.prisma.movie.create({
      data: {
        title: body.title,
        slug: body.slug,
        year: body.year,
        posterUrl: body.posterUrl,
        videoUrl: body.videoUrl,
        externalId,
        imdbId: body.imdbId || null,
        isPremiere: body.isPremiere ?? false,
        categoryId: categoryId ?? null,
      },
      include: MOVIE_INCLUDE,
    });

    // Connect genres
    if (body.genres?.length) {
      for (const slug of body.genres) {
        const genre = await this.prisma.genre.upsert({
          where: { slug },
          update: {},
          create: { slug, name: slug.charAt(0).toUpperCase() + slug.slice(1) },
        });
        await this.prisma.movieGenre.upsert({
          where: { movieId_genreId: { movieId: movie.id, genreId: genre.id } },
          update: {},
          create: { movieId: movie.id, genreId: genre.id },
        });
      }
    }

    // Refresh with genres
    const fresh = await this.prisma.movie.findUnique({ where: { id: movie.id }, include: MOVIE_INCLUDE });
    return formatMovie(fresh!);
  }
}
