export function getCountryFromHeaders(headers: Headers): string {
  return headers.get("x-vercel-ip-country") || "US";
}
