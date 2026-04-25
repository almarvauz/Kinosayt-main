import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ScraperService implements OnModuleInit {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("imdb-enrich") private readonly queue: Queue
  ) {}

  async onModuleInit() {
    if (process.env.IMDB_ENRICH !== "true") {
      this.logger.log("IMDb enrichment disabled (set IMDB_ENRICH=true to enable)");
      return;
    }
    setImmediate(() => this.enqueueUnenriched().catch(() => {}));
  }

  async enqueueUnenriched() {
    // Reset previously failed attempts (marked with empty string)
    const resetCount = await this.prisma.movie.updateMany({
      where: { imdbDescription: "" },
      data: { imdbDescription: null },
    });
    if (resetCount.count > 0) {
      this.logger.log(`Reset ${resetCount.count} previously skipped movies for re-enrichment`);
    }

    const unenriched = await this.prisma.movie.findMany({
      where: { imdbDescription: null },
      select: { id: true, title: true, year: true },
      take: 1000,
    });

    if (unenriched.length === 0) {
      this.logger.log("All movies already processed for IMDb enrichment");
      return;
    }

    this.logger.log(`Enqueueing ${unenriched.length} movies for IMDb enrichment`);

    const jobs = unenriched.map((movie: { id: number; title: string; year: number }, index: number) => ({
      name: "enrich",
      data: { movieId: movie.id, title: movie.title, year: movie.year },
      opts: {
        delay: index * 2500, // ~2.5s between jobs (scraping, no API key limits)
        attempts: 2,
        backoff: { type: "exponential" as const, delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    }));

    await this.queue.addBulk(jobs);
  }
}
