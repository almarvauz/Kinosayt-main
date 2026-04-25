import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

const INDEX = "movies";

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly esBase: string;
  private esAvailable = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.esBase = (config.get<string>("ELASTICSEARCH_URL") ?? "").replace(/\/$/, "");
  }

  async onModuleInit() {
    if (!this.esBase) {
      this.logger.log("Elasticsearch disabled (ELASTICSEARCH_URL not set)");
      return;
    }
    try {
      const res = await fetch(this.esBase, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`ES responded ${res.status}`);
      this.esAvailable = true;
      this.logger.log("Elasticsearch connected");
      await this.ensureIndex();
      setImmediate(() => this.syncAll().catch((e) => this.logger.error("syncAll error", e)));
    } catch (e) {
      this.logger.warn("Elasticsearch unavailable, using Prisma fallback for search");
    }
  }

  private async esRequest(path: string, method = "GET", body?: unknown): Promise<any> {
    if (!this.esAvailable) return null;
    const url = `${this.esBase}${path}`;
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    const res = await fetch(url, init);
    if (res.status === 404 && method === "GET") return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  }

  private async ensureIndex() {
    const result = await this.esRequest(`/${INDEX}`);
    if (result && !result.error) return;

    await this.esRequest(`/${INDEX}`, "PUT", {
      mappings: {
        properties: {
          id: { type: "integer" },
          title: { type: "text", analyzer: "standard" },
          titleClean: { type: "text", analyzer: "standard" },
          slug: { type: "keyword" },
          year: { type: "integer" },
          posterUrl: { type: "keyword", index: false },
          videoUrl: { type: "keyword", index: false },
          imdbRating: { type: "float" },
          imdbDescription: { type: "text" },
          viewCount: { type: "integer" },
          genres: { type: "keyword" },
        },
      },
    });
    this.logger.log(`Created ES index: ${INDEX}`);
  }

  async syncAll() {
    const count = await this.prisma.movie.count();
    this.logger.log(`Syncing ${count} movies to Elasticsearch...`);

    const batchSize = 500;
    let skip = 0;

    while (skip < count) {
      const movies = await this.prisma.movie.findMany({
        skip,
        take: batchSize,
        include: { genres: { include: { genre: true } } },
      });
      if (!movies.length) break;

      const lines: string[] = [];
      for (const m of movies) {
        lines.push(JSON.stringify({ index: { _index: INDEX, _id: String(m.id) } }));
        lines.push(
          JSON.stringify({
            id: m.id,
            title: m.title,
            titleClean: cleanUzbek(m.title),
            slug: m.slug,
            year: m.year,
            posterUrl: m.posterUrl,
            videoUrl: m.videoUrl,
            imdbRating: m.imdbRating ?? 0,
            imdbDescription: m.imdbDescription ?? "",
            viewCount: m.viewCount,
            genres: m.genres.map((mg: any) => mg.genre.name),
          })
        );
      }

      const body = lines.join("\n") + "\n";
      const res = await fetch(`${this.esBase}/_bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/x-ndjson" },
        body,
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) this.logger.error(`Bulk index failed: ${res.status}`);
      skip += batchSize;
    }

    await this.esRequest(`/${INDEX}/_refresh`, "POST");
    const countResult = await this.esRequest(`/${INDEX}/_count`);
    this.logger.log(`ES sync complete — ${countResult?.count ?? "?"} movies indexed`);
  }

  async indexMovie(movie: {
    id: number;
    title: string;
    slug: string;
    year: number;
    posterUrl: string;
    videoUrl: string;
    imdbRating?: number | null;
    imdbDescription?: string | null;
    viewCount: number;
    genres: string[];
  }) {
    if (!this.esAvailable) return;
    await this.esRequest(`/${INDEX}/_doc/${movie.id}`, "PUT", {
      ...movie,
      titleClean: cleanUzbek(movie.title),
      imdbRating: movie.imdbRating ?? 0,
      imdbDescription: movie.imdbDescription ?? "",
    });
  }

  async search(
    query: string,
    page = 1,
    limit = 20,
    filters: { genre?: string; year?: number; sort?: string } = {}
  ): Promise<{ ids: number[]; total: number }> {
    if (!this.esAvailable) return { ids: [], total: 0 };
    const from = (page - 1) * limit;
    const cleanQuery = cleanUzbek(query);

    const must: any[] = [
      {
        multi_match: {
          query: cleanQuery || query,
          fields: ["title^2", "titleClean^3", "imdbDescription"],
          fuzziness: "AUTO",
          operator: "or",
        },
      },
    ];

    const esFilter: any[] = [];
    if (filters.genre) esFilter.push({ term: { genres: filters.genre } });
    if (filters.year) esFilter.push({ term: { year: filters.year } });

    let sort: any[] = ["_score"];
    if (filters.sort === "trending") sort = [{ viewCount: "desc" }, "_score"];
    if (filters.sort === "rating") sort = [{ imdbRating: "desc" }, "_score"];
    if (filters.sort === "newest") sort = [{ id: "desc" }];

    const esQuery: any = {
      query: {
        bool: {
          must,
          ...(esFilter.length ? { filter: esFilter } : {}),
        },
      },
      sort,
      from,
      size: limit,
    };

    const result = await this.esRequest(`/${INDEX}/_search`, "POST", esQuery);
    if (!result?.hits) return { ids: [], total: 0 };

    const hits = result.hits.hits ?? [];
    const total = result.hits.total?.value ?? result.hits.total ?? 0;

    return {
      ids: hits.map((h: any) => parseInt(h._id)),
      total,
    };
  }

  async deleteMovie(id: number) {
    if (!this.esAvailable) return;
    await this.esRequest(`/${INDEX}/_doc/${id}`, "DELETE");
  }
}

/** Strip Uzbek dubbing suffixes for better matching */
export function cleanUzbek(title: string): string {
  return title
    .replace(/\bo['']zbek\s+tilida\b/gi, "")
    .replace(/\buzbek\s+tilida\b/gi, "")
    .replace(/\btilida\b/gi, "")
    .replace(/\bO['']zbek\b/gi, "")
    .replace(/\s*\/.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}
