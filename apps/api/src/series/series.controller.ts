import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { SeriesService } from "./series.service";

@Controller("series")
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  findAll(
    @Query("q") q?: string,
    @Query("genre") genre?: string,
    @Query("category") category?: string,
    @Query("year") year?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: string,
  ) {
    return this.seriesService.findAll({
      q,
      genre,
      category,
      year: year ? parseInt(year) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? Math.min(parseInt(limit), 100) : 20,
      sort,
    });
  }

  @Get("trending")
  trending() {
    return this.seriesService.trending(20);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.seriesService.findBySlug(slug);
  }

  @Post(":slug/view")
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementView(@Param("slug") slug: string) {
    await this.seriesService.incrementView(slug);
  }

  @Get(":slug/season/:season/episode/:episode/stream")
  async getEpisodeStream(
    @Param("slug") slug: string,
    @Param("season") season: string,
    @Param("episode") episode: string,
  ) {
    const videoUrl = await this.seriesService.getEpisodeVideoUrl(
      slug,
      parseInt(season),
      parseInt(episode),
    );
    return { videoUrl };
  }

  @Post(":slug/season/:season/episode/:episode/view")
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementEpisodeView(
    @Param("slug") slug: string,
    @Param("season") season: string,
    @Param("episode") episode: string,
  ) {
    await this.seriesService.incrementEpisodeView(slug, parseInt(season), parseInt(episode));
  }
}
