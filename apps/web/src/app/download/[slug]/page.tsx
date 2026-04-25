import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { MovieDto } from "@kinosayt/types";
import { DownloadRedirect } from "./download-redirect";

interface Props {
  params: { slug: string };
}

export default async function DownloadPage({ params }: Props) {
  let movie: MovieDto;
  try {
    movie = await apiClient.getMovie(params.slug);
  } catch {
    notFound();
  }

  return <DownloadRedirect slug={movie.slug} title={movie.title} />;
}
