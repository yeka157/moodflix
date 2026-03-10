import type { ReleaseDateResult, WatchProviderResult } from "@/types/movie";

export type AvailabilityStatus =
  | { type: "available" }           // Has providers -- show normal tabs
  | { type: "in_theaters" }         // Recent theatrical release, no digital yet
  | { type: "not_yet_streaming" }   // Theatrical ended or not yet released, no digital/streaming
  | { type: "not_in_region" };      // No providers in user's country

const THEATRICAL_WINDOW_DAYS = 120;

function daysSince(dateStr: string): number {
  const releaseMs = new Date(dateStr).getTime();
  return (Date.now() - releaseMs) / (1000 * 60 * 60 * 24);
}

export function getMovieAvailabilityStatus(opts: {
  watchProviders: WatchProviderResult | null | undefined;
  releaseDates?: ReleaseDateResult[];
  country: string;
  releaseDate?: string;  // Movie release_date field as fallback
}): AvailabilityStatus {
  const { watchProviders, releaseDates, country, releaseDate } = opts;

  // If providers exist, it's available
  if (
    (watchProviders?.flatrate?.length ?? 0) > 0 ||
    (watchProviders?.rent?.length ?? 0) > 0 ||
    (watchProviders?.buy?.length ?? 0) > 0
  ) {
    return { type: "available" };
  }

  // Try to find release dates for the user's country, fall back to US
  let countryDates = releaseDates?.find((r) => r.iso_3166_1 === country);
  if (!countryDates && country !== "US") {
    countryDates = releaseDates?.find((r) => r.iso_3166_1 === "US");
  }

  if (countryDates) {
    const entries = countryDates.release_dates;

    // Check for digital/physical/TV release (types 4, 5, 6)
    const hasDigital = entries.some((e) => e.type === 4 || e.type === 5 || e.type === 6);
    if (hasDigital) {
      // Has digital release but no providers in region
      return { type: "not_in_region" };
    }

    // Check for theatrical release (types 2 or 3)
    const theatrical = entries.find((e) => e.type === 2 || e.type === 3);
    if (theatrical?.release_date) {
      const days = daysSince(theatrical.release_date);
      if (days >= 0 && days <= THEATRICAL_WINDOW_DAYS) {
        return { type: "in_theaters" };
      }
      if (days > THEATRICAL_WINDOW_DAYS) {
        return { type: "not_yet_streaming" };
      }
      // Future theatrical release
      return { type: "not_yet_streaming" };
    }
  }

  // No release_dates data — fall back to the movie's main release_date field
  if (releaseDate) {
    const days = daysSince(releaseDate);
    if (days >= 0 && days <= THEATRICAL_WINDOW_DAYS) {
      return { type: "in_theaters" };
    }
  }

  return { type: "not_in_region" };
}

export function getTVAvailabilityStatus(opts: {
  watchProviders: WatchProviderResult | null | undefined;
  status: string;          // TVDetails.status
  firstAirDate?: string;   // TVShow.first_air_date
}): AvailabilityStatus {
  const { watchProviders, status, firstAirDate } = opts;

  // If providers exist, it's available
  if (
    (watchProviders?.flatrate?.length ?? 0) > 0 ||
    (watchProviders?.rent?.length ?? 0) > 0 ||
    (watchProviders?.buy?.length ?? 0) > 0
  ) {
    return { type: "available" };
  }

  // Shows not yet released
  if (status === "In Production" || status === "Planned" || status === "Pilot") {
    return { type: "not_yet_streaming" };
  }

  // Returning series that started airing within the last year may not have streaming yet
  if (status === "Returning Series" && firstAirDate) {
    const daysSinceAir = daysSince(firstAirDate);
    if (daysSinceAir <= 365) {
      return { type: "not_yet_streaming" };
    }
  }

  return { type: "not_in_region" };
}
