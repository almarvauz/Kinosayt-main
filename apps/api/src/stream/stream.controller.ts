import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Controller("stream")
export class StreamController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Redirect to the direct video URL (fastest).
   * Use ?proxy=1 to force proxying through the API.
   */
  @Get(":slug")
  async stream(
    @Param("slug") slug: string,
    @Query("q") quality: string | undefined,
    @Query("proxy") proxy: string | undefined,
    @Req() req: any,
    @Res() res: any
  ) {
    const movie = await this.prisma.movie.findUnique({ where: { slug } });
    if (!movie) throw new NotFoundException("Movie not found");

    let videoUrl = movie.videoUrl;

    // If a quality is requested, swap the suffix
    if (quality) {
      const q = parseInt(quality);
      if ([360, 480, 720, 1080].includes(q)) {
        videoUrl = videoUrl.replace(/_\d+\.mp4$/i, `_${q}.mp4`);
      }
    }

    // Default: redirect to direct URL (no proxying overhead)
    // Encode special chars in the path (e.g. apostrophes in Uzbek filenames)
    const safeUrl = encodeVideoUrl(videoUrl);
    if (proxy !== "1") {
      res
        .status(302)
        .headers({
          Location: safeUrl,
          "Cache-Control": "public, max-age=3600",
        })
        .send();
      return;
    }

    // Fallback: full proxy mode for servers that block direct access
    const range = req.headers["range"];
    const upstreamHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (compatible; Kinosayt/1.0)",
    };
    if (range) upstreamHeaders["Range"] = range;

    const upstream = await fetch(safeUrl, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(30000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      res.status(upstream.status).send({ error: "Upstream error" });
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "video/mp4";
    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    const acceptRanges = upstream.headers.get("accept-ranges") ?? "bytes";

    const replyHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": acceptRanges,
      "Cache-Control": "public, max-age=3600",
    };
    if (contentLength) replyHeaders["Content-Length"] = contentLength;
    if (contentRange) replyHeaders["Content-Range"] = contentRange;

    res.status(range ? 206 : 200).headers(replyHeaders);

    if (!upstream.body) {
      res.send(null);
      return;
    }

    // Pipe using Node stream for better throughput
    const { Readable } = await import("stream");
    const nodeStream = Readable.fromWeb(upstream.body as any);
    nodeStream.pipe(res.raw);
    nodeStream.on("error", () => res.raw.end());
    req.raw.on("close", () => nodeStream.destroy());
  }
}

/**
 * Encode special characters in a video URL path without double-encoding.
 * Handles apostrophes and other chars in Uzbek filenames (e.g. so'zlar_720.mp4).
 */
function encodeVideoUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // Re-encode the pathname segments, preserving slashes
    url.pathname = url.pathname
      .split("/")
      .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
      .join("/");
    return url.toString();
  } catch {
    return rawUrl;
  }
}
