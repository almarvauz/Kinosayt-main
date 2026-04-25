import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface EnrichJob {
  movieId: number;
  title: string;
  year?: number;
}

/** IMDb suggestion API result */
interface SuggestionItem {
  id: string;    // e.g. "tt0152930"
  l: string;     // title
  y?: number;    // year
  qid?: string;  // "movie" | "tvSeries" etc
  q?: string;    // "feature" etc
  i?: { imageUrl: string };
  s?: string;    // stars
}

/** IMDb GraphQL title result */
interface GqlTitle {
  titleText?: { text: string };
  releaseYear?: { year: number };
  plot?: { plotText?: { plainText: string } };
  ratingsSummary?: { aggregateRating: number | null };
  primaryImage?: { url: string };
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DELAY_MS = 1000; // polite 1s between requests

@Processor("imdb-enrich", { concurrency: 1 })
export class ImdbProcessor extends WorkerHost {
  private readonly logger = new Logger(ImdbProcessor.name);
  private consecutiveErrors = 0;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<EnrichJob>): Promise<void> {
    const { movieId, title, year } = job.data;

    // Circuit breaker: too many consecutive errors → back off
    if (this.consecutiveErrors >= 10) {
      this.logger.warn(`Too many errors (${this.consecutiveErrors}), skipping [${movieId}] ${title}`);
      return;
    }

    const variants = getTitleVariants(title);
    if (!variants.length) {
      await this.markProcessed(movieId);
      return;
    }

    try {
      // Try multiple title variants (all "/" separated parts)
      let imdbId: string | null = null;
      for (const variant of variants) {
        imdbId = await this.searchImdb(variant, year);
        if (imdbId) break;
        await this.sleep(DELAY_MS);
      }

      if (!imdbId) {
        this.logger.debug(`No IMDb match for: "${variants.join('" / "')}" (original: "${title}")`);
        await this.markProcessed(movieId);
        this.consecutiveErrors = 0;
        return;
      }

      // Step 2: Fetch full details via IMDb GraphQL
      await this.sleep(DELAY_MS);
      const details = await this.fetchDetails(imdbId);

      if (!details) {
        this.logger.debug(`No details for ${imdbId} ("${cleanTitle}")`);
        await this.markProcessed(movieId);
        return;
      }

      const updateData: Record<string, unknown> = {
        imdbId,
        imdbDescription: details.plot?.plotText?.plainText || null,
        imdbRating: details.ratingsSummary?.aggregateRating ?? null,
      };

      // Update poster if IMDb has one
      if (details.primaryImage?.url) {
        updateData.posterUrl = details.primaryImage.url;
      }

      await this.prisma.movie.update({
        where: { id: movieId },
        data: updateData,
      });

      this.consecutiveErrors = 0;
      this.logger.log(
        `Enriched [${movieId}] "${cleanTitle}" → ${details.titleText?.text} (${imdbId}) ★${details.ratingsSummary?.aggregateRating ?? "N/A"}`
      );
    } catch (err) {
      this.consecutiveErrors++;
      this.logger.error(`Error enriching [${movieId}] "${cleanTitle}":`, err);
      throw err; // BullMQ retry
    }
  }

  /**
   * IMDb suggestion API — lightweight JSON, no auth needed.
   * Returns the best matching IMDb ID or null.
   */
  private async searchImdb(query: string, year?: number): Promise<string | null> {
    // Suggestion API uses first letter and lowercase slug
    const slug = query.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
    const firstChar = slug[0] || "a";
    const url = `https://v2.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(query.toLowerCase())}.json`;

    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { d?: SuggestionItem[] };
    if (!data.d?.length) return null;

    // Filter to movies only
    const movies = data.d.filter(
      (r) => r.qid === "movie" || r.q === "feature"
    );
    if (!movies.length) return null;

    // Pick best match
    return pickBest(query, movies, year)?.id ?? null;
  }

  /**
   * IMDb GraphQL API — public, no auth needed.
   * Returns plot, rating, poster for a given IMDb ID.
   */
  private async fetchDetails(imdbId: string): Promise<GqlTitle | null> {
    const gql = `query{title(id:"${imdbId}"){titleText{text}releaseYear{year}plot{plotText{plainText}}ratingsSummary{aggregateRating}primaryImage{url}}}`;

    const res = await fetch("https://graphql.imdb.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA,
      },
      body: JSON.stringify({ query: gql }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as { data?: { title?: GqlTitle } };
    return json.data?.title ?? null;
  }

  private async markProcessed(movieId: number) {
    await this.prisma.movie.update({
      where: { id: movieId },
      data: { imdbDescription: "" },
    });
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

// ── Helpers ──────────────────────────────────────────────────

const UZBEK_NOISE = /\b(o['']zbek|uzbek|tilida|tarjima|dublyaj|gobliddin|multfilm)\b/gi;
const BRACKET_YEAR = /\s*\(\d{4}\)\s*/g;

function stripUzbek(s: string): string {
  return s
    .replace(UZBEK_NOISE, "")
    .replace(BRACKET_YEAR, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate multiple search variants from a movie title.
 * "Taxi 1 / Taksi 1 / Kirakash 1 Uzbek tilida" → ["Taxi 1", "Taksi 1", "Kirakash 1"]
 * "Nafas Olma Uzbek tilida" → ["Nafas Olma"]
 */
function getTitleVariants(raw: string): string[] {
  // Strip Uzbek markers first
  const cleaned = stripUzbek(raw);

  // Split by "/" and clean each part
  const parts = cleaned.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean);

  // Also add colon-split (e.g., "Maxsus askar: Jon Kelli" → try "Jon Kelli" too)
  const variants: string[] = [];
  for (const part of parts) {
    // Remove trailing numbers that look like quality/part markers
    const clean = part.replace(/\s+\d+$/, "").trim();
    if (clean.length >= 2) variants.push(clean);
    // With the number (might be sequel number)
    if (part !== clean && part.length >= 2) variants.push(part);
  }

  // Deduplicate preserving order
  return [...new Set(variants)];
}

function pickBest(
  query: string,
  items: SuggestionItem[],
  year?: number
): SuggestionItem | null {
  const q = query.toLowerCase();
  let best: SuggestionItem | null = null;
  let bestScore = -1;

  for (const item of items) {
    const t = item.l.toLowerCase();
    let score = 0;

    if (t === q) score += 100;
    else if (t.includes(q) || q.includes(t)) score += 50;
    else {
      // partial word overlap
      const qWords = q.split(/\s+/);
      const tWords = t.split(/\s+/);
      const overlap = qWords.filter((w) => tWords.includes(w)).length;
      score += overlap * 15;
    }

    if (year && item.y === year) score += 25;
    if (year && item.y && Math.abs(item.y - year) <= 1) score += 10;

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return bestScore >= 15 ? best : null;
}

