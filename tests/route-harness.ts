import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import type { RouteMocks } from "../types/security-tests";

const ALL_MODULES = /.*/;

export async function loadRoute<T>(entry: string, mocks: RouteMocks) {
  const key = `security-test-${randomUUID()}`;
  Object.defineProperty(globalThis, key, { configurable: true, value: mocks });
  const directory = await mkdtemp(join(tmpdir(), "moodflix-test-"));
  const outfile = join(directory, "route.mjs");
  const modules: Record<string, string> = {
    "@/drizzle": `export const db = globalThis[${JSON.stringify(key)}].db;`,
    "@/lib/rate-limit":
      "export const checkWindowedLimit = () => ({allowed: true}); export const rateLimitResponse = () => new Response(null, {status:429});",
    "@/lib/supabase/api-auth": `export const getApiUser = globalThis[${JSON.stringify(key)}].getApiUser;`,
    "@/lib/tmdb": `export const getMovieDetails = globalThis[${JSON.stringify(key)}].getMovieDetails;`,
    "@/lib/web-push": `export const sendPushNotification = globalThis[${JSON.stringify(key)}].sendPushNotification;`,
    "next/server":
      "export const NextResponse = Response; export const NextRequest = Request;",
  };
  try {
    const result = await build({
      bundle: true,
      entryPoints: [resolve(entry)],
      format: "esm",
      platform: "node",
      plugins: [
        {
          name: "route-mocks",
          setup(builder) {
            builder.onResolve({ filter: ALL_MODULES }, (args) =>
              args.path in modules
                ? { namespace: "mock", path: args.path }
                : undefined
            );
            builder.onLoad(
              { filter: ALL_MODULES, namespace: "mock" },
              (args) => ({
                contents: modules[args.path],
                loader: "js",
              })
            );
          },
        },
      ],
      write: false,
    });
    await writeFile(outfile, result.outputFiles[0].text);
    const route: T = await import(pathToFileURL(outfile).href);
    return {
      async cleanup() {
        Reflect.deleteProperty(globalThis, key);
        await rm(directory, { recursive: true });
      },
      route,
    };
  } catch (error) {
    Reflect.deleteProperty(globalThis, key);
    await rm(directory, { recursive: true });
    throw error;
  }
}

export class Rows {
  readonly rows: unknown[];
  constructor(rows: unknown[]) {
    this.rows = rows;
  }
  from() {
    return this;
  }
  where() {
    return this;
  }
  leftJoin() {
    return this;
  }
  orderBy() {
    return this;
  }
  for() {
    return Promise.resolve(this.rows);
  }
  limit(limit: number) {
    return Promise.resolve(this.rows.slice(0, limit));
  }
  // biome-ignore lint/suspicious/noThenProperty: Drizzle query builders are intentionally thenable
  then(onResolved: (rows: unknown[]) => unknown) {
    return Promise.resolve(this.rows).then(onResolved);
  }
}
