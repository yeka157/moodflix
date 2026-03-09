"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "@ai-sdk/react";
import type { GenreSuggestion, IdentifiedMediaResult } from "@/types/ai";

export function useMoodChat() {
  const [conversationId] = useState(() => crypto.randomUUID());

  const transport = new DefaultChatTransport({
    api: "/api/ai/recommend",
    body: { conversationId },
  });

  const chat = useChat({ transport });

  const genreSuggestion = extractLatestGenreSuggestion(chat.messages);
  const identifiedMedia = extractLatestIdentifiedMedia(chat.messages);

  return { ...chat, genreSuggestion, identifiedMedia };
}

function extractLatestIdentifiedMedia(
  messages: UIMessage[],
): IdentifiedMediaResult | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    for (const part of msg.parts ?? []) {
      if (
        part.type.startsWith("tool-") &&
        "output" in part &&
        part.state === "output-available"
      ) {
        const output = part.output as Record<string, unknown>;
        // Distinguish from genre suggestions by checking for matches array
        if ("matches" in output && Array.isArray(output.matches)) {
          return output as unknown as IdentifiedMediaResult;
        }
      }
    }
  }
  return null;
}

function extractLatestGenreSuggestion(
  messages: UIMessage[],
): GenreSuggestion | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    for (const part of msg.parts ?? []) {
      if (
        part.type.startsWith("tool-") &&
        "output" in part &&
        part.state === "output-available"
      ) {
        const output = part.output as Record<string, unknown>;
        // Only return outputs that have genres (distinguish from identify_media)
        if ("genres" in output && Array.isArray(output.genres)) {
          return output as unknown as GenreSuggestion;
        }
      }
    }
  }
  return null;
}
