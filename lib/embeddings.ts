import { google, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

import type { MediaTextInput } from "@/types/ai";

/**
 * Embedding helpers for RAG-grounded recommendations.
 * Spec: docs/superpowers/specs/2026-07-16-rag-recommendations-design.md
 *
 * This module is the single owner of the model id, dimensionality, task types,
 * and normalization. Nothing else should construct an embedding model.
 */

/**
 * The identity triple. Every media_embeddings row is stamped with these and
 * every read filters on them.
 *
 * Never inline these literals at a call site: the moment a second `kind` or a
 * second model generation exists, an unfiltered query silently mixes
 * incomparable vectors into one result set instead of failing loudly.
 */
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMS = 768;
export const VECTOR_KIND = "summary";

const model = google.embedding(EMBEDDING_MODEL);

/**
 * gemini-embedding-001 returns 3072 dims by default. At
 * outputDimensionality: 768 the vector is MRL-truncated, which leaves it
 * non-unit-length. Cosine distance tolerates that, but normalizing keeps
 * similarity scores in a comparable range across every write site — and the
 * taste vector (a weighted average of these) is easier to reason about when
 * its inputs are unit vectors.
 */
export function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  // Degenerate vector — return as-is rather than dividing by ~0.
  if (norm < 1e-10) return v;
  return v.map((x) => x / norm);
}

/**
 * Embed a search query. Asymmetric pairing with embedDocuments (QUERY vs
 * DOCUMENT task type) measurably improves retrieval — do not collapse the two.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model,
    value: text,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMS,
        taskType: "RETRIEVAL_QUERY",
      } satisfies GoogleEmbeddingModelOptions,
    },
  });
  return normalize(embedding);
}

/**
 * Embed corpus documents. `embedMany` handles API-sized batching internally,
 * so callers can pass a whole chunk.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model,
    values: texts,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMS,
        taskType: "RETRIEVAL_DOCUMENT",
      } satisfies GoogleEmbeddingModelOptions,
    },
  });
  return embeddings.map(normalize);
}

/**
 * Compose the text embedded for one catalog title.
 *
 * Order matters loosely — title and origin lead so short queries about a
 * specific film or "korean drama" style requests land near the front of the
 * sequence. Empty fields are dropped rather than emitted as "Genres: ." noise,
 * which would otherwise make sparse titles look similar to each other.
 */
export function composeMediaText(m: MediaTextInput): string {
  const parts = [
    `${m.title}${m.year ? ` (${m.year})` : ""}.`,
    m.originWords ? `${m.originWords}.` : "",
    m.genres.length ? `Genres: ${m.genres.join(", ")}.` : "",
    m.director ? `Directed by ${m.director}.` : "",
    m.cast.length ? `Starring ${m.cast.join(", ")}.` : "",
    m.keywords.length ? `Keywords: ${m.keywords.join(", ")}.` : "",
    m.overview ?? "",
  ];
  return parts.filter(Boolean).join(" ").trim();
}
