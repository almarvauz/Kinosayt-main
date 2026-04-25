import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerModule } from "@nestjs/throttler";
import { redisStore } from "cache-manager-ioredis-yet";
import { PrismaModule } from "./prisma/prisma.module";
import { MoviesModule } from "./movies/movies.module";
import { GenresModule } from "./genres/genres.module";
import { CategoriesModule } from "./categories/categories.module";
import { StreamModule } from "./stream/stream.module";
import { ScraperModule } from "./scraper/scraper.module";
import { SearchModule } from "./search/search.module";
import { StorageModule } from "./storage/storage.module";
import { SeriesModule } from "./series/series.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.getOrThrow<string>("REDIS_URL");
        const parsed = new URL(redisUrl);
        return {
          store: await redisStore({
            host: parsed.hostname,
            port: parseInt(parsed.port || "6379"),
          }),
          ttl: 300,
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>("REDIS_URL") },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    MoviesModule,
    GenresModule,
    CategoriesModule,
    StreamModule,
    ScraperModule,
    SearchModule,
    StorageModule,
    SeriesModule,
  ],
})
export class AppModule {}
