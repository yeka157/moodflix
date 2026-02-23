import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import type { WatchProviderResult } from "@/types/movie";
import { getTVDetails } from "@/lib/tmdb";
import { getCountryFromHeaders } from "@/lib/country";
import { TVDetailPageContent } from "@/components/movies/tv-detail-page";
import { TMDB_IMAGE_BASE } from "@/lib/constants";

interface TVPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TVPageProps): Promise<Metadata> {
  const { id } = await params;
  const tvId = parseInt(id, 10);
  if (isNaN(tvId)) return {};

  try {
    const details = await getTVDetails(tvId);
    return {
      title: details.name,
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

export default async function TVPage({ params }: TVPageProps) {
  const { id } = await params;
  const tvId = parseInt(id, 10);
  if (isNaN(tvId)) notFound();

  const requestHeaders = await headers();
  const country = getCountryFromHeaders(requestHeaders);

  const details = await getTVDetails(tvId).catch(() => null);
  if (!details) notFound();

  const watchProviders: WatchProviderResult | null =
    details["watch/providers"]?.results?.[country] ?? null;

  return (
    <TVDetailPageContent
      details={details}
      watchProviders={watchProviders}
      country={country}
    />
  );
}
