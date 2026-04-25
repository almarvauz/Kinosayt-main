import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ScraperService } from "./scraper.service";
import { ImdbProcessor } from "./imdb.processor";

@Module({
  imports: [
    BullModule.registerQueue({ name: "imdb-enrich" }),
  ],
  providers: [ScraperService, ImdbProcessor],
})
export class ScraperModule {}
