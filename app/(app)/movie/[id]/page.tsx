import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import type { WatchProviderResult } from "@/types/movie";
import { getMovieDetails, getMovieRecommendations } from "@/lib/tmdb";
import { getCountryFromHeaders } from "@/lib/country";
import { MovieDetailPageContent } from "@/components/movies/movie-detail-page";
import { TMDB_IMAGE_BASE } from "@/lib/constants";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const movieId = parseInt(id, 10);
  if (isNaN(movieId)) return {};

  try {
    const details = await getMovieDetails(movieId);
    return {
      title: details.title,
      description: details.overview?.slice(0, 160) ?? undefined,
      openGraph: {
        images: details.backdrop_path
          ? [`${TMDB_IMAGE_BASE}/w1280${details.backdrop_path}`]
          : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  const movieId = parseInt(id, 10);
  if (isNaN(movieId)) notFound();

  const requestHeaders = await headers();
  const country = getCountryFromHeaders(requestHeaders);

  const [details, recommendations] = await Promise.all([
    getMovieDetails(movieId).catch(() => null),
    getMovieRecommendations(movieId).catch(() => null),
  ]);

  if (!details) notFound();

  const watchProviders: WatchProviderResult | null =
    details["watch/providers"]?.results?.[country] ?? null;

  return (
    <MovieDetailPageContent
      details={details}
      watchProviders={watchProviders}
      recommendations={recommendations?.results ?? []}
      country={country}
    />
  );
}
