"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "@ai-sdk/react";
import type { GenreSuggestion } from "@/types/ai";

export function useMoodChat() {
  const [conversationId] = useState(() => crypto.randomUUID());

  const transport = new DefaultChatTransport({
    api: "/api/ai/recommend",
    body: { conversationId },
  });

  const chat = useChat({ transport });

  const genreSuggestion = extractLatestGenreSuggestion(chat.messages);

  return { ...chat, genreSuggestion };
}

function extractLatestGenreSuggestion(
  messages: UIMessage[],
): GenreSuggestion | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    for (const part of msg.parts) {
      if (
        part.type.startsWith("tool-") &&
        "output" in part &&
        part.state === "output-available"
      ) {
        return part.output as GenreSuggestion;
      }
    }
  }
  return null;
}
