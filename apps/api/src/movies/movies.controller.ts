import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";

import { MoviesService } from "./movies.service";
import { GetMoviesDto } from "./dto/get-movies.dto";

@Controller("movies")
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  findAll(@Query() dto: GetMoviesDto) {
    return this.moviesService.findAll(dto);
  }

  @Get("trending")
  trending() {
    return this.moviesService.trending(30);
  }

  @Get(":slug/qualities")
  getQualities(@Param("slug") slug: string) {
    return this.moviesService.getQualities(slug);
  }

  @Post(":slug/view")
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementView(@Param("slug") slug: string) {
    await this.moviesService.incrementView(slug);
  }

  @Get(":slug/download")
  async downloadMovie(
    @Param("slug") slug: string,
    @Res({ passthrough: false }) res: FastifyReply,
  ) {
    const movie = await this.moviesService.findBySlug(slug);
    const videoUrl = movie.videoUrl;

    // Fetch the remote video as a stream, following redirects
    const upstream = await fetch(videoUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(60000),
    });

    if (!upstream.ok || !upstream.body) {
      res.status(502).send({ error: "Failed to fetch video" });
      return;
    }

    const contentLength = upstream.headers.get("content-length");
    const safeName = movie.title.replace(/[^a-zA-Z0-9_\-\s.]/g, "").trim() || slug;

    res.raw.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${safeName}.mp4"`,
      ...(contentLength ? { "Content-Length": contentLength } : {}),
    });

    // Pipe the ReadableStream to the raw Node.js response
    const reader = (upstream.body as ReadableStream<Uint8Array>).getReader();
    const onClose = () => reader.cancel();
    res.raw.on("close", onClose);
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const ok = res.raw.write(Buffer.from(value));
        if (!ok) {
          await new Promise<void>((resolve) => res.raw.once("drain", resolve));
        }
      }
      res.raw.end();
    } catch {
      res.raw.destroy();
    }
  }

  @Patch(":slug/code")
  async setMovieCode(
    @Param("slug") slug: string,
    @Body() body: { code: string | null },
  ) {
    return this.moviesService.setCode(slug, body.code);
  }

  @Get("by-code/:code")
  async findByCode(
    @Param("code") code: string,
    @Query("page") page?: string,
  ) {
    return this.moviesService.findByCode(code, page ? parseInt(page) : 1);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.moviesService.findBySlug(slug);
  }
}
