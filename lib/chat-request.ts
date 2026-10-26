import { z } from "zod";

const textPart = z.object({ text: z.string(), type: z.literal("text") });
const toolPart = z.object({
  errorText: z.string().optional(),
  input: z.json().optional(),
  output: z.json().optional(),
  state: z.enum(["output-available", "output-error"]),
  toolCallId: z.string(),
  type: z.enum(["tool-suggest_genres", "tool-identify_media"]),
});

// An explicit allowlist prevents file URLs (including historical assistant
// attachments) from reaching the SDK's server-side downloader.
export const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  messages: z
    .array(
      z.discriminatedUnion("role", [
        z.object({
          id: z.string().optional(),
          parts: z
            .array(textPart)
            .min(1)
            .refine(
              (parts) =>
                parts.reduce((length, part) => length + part.text.length, 0) <=
                500
            ),
          role: z.literal("user"),
        }),
        z.object({
          id: z.string().optional(),
          parts: z.array(
            z.union([
              textPart,
              toolPart,
              z.object({ type: z.literal("step-start") }),
            ])
          ),
          role: z.literal("assistant"),
        }),
      ])
    )
    .min(1)
    .max(100)
    .refine((messages) => messages.at(-1)?.role === "user"),
});
