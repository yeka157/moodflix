"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { Loader } from "@/components/ui/loader";
import { useMoodChat } from "@/hooks/use-ai";
import { ShazamCard } from "@/components/ai/shazam-card";
import { COUNTRY_LABELS } from "@/lib/constants";
import type { GenreSuggestion, IdentifiedMedia } from "@/types/ai";
import type { UIMessage } from "@ai-sdk/react";

type MessageParts = NonNullable<UIMessage["parts"]>;

/** Extract genre suggestion from a single message's parts */
function getMessageGenreSuggestion(parts: MessageParts): GenreSuggestion | null {
  for (const part of parts) {
    if (
      part.type.startsWith("tool-") &&
      "output" in part &&
      part.state === "output-available"
    ) {
      const output = part.output as Record<string, unknown>;
      if ("genres" in output && Array.isArray(output.genres)) {
        return output as unknown as GenreSuggestion;
      }
    }
  }
  return null;
}

/** Extract identified media from a single message's parts */
function getMessageIdentifiedMedia(parts: MessageParts): IdentifiedMedia | null {
  for (const part of parts) {
    if (
      part.type.startsWith("tool-") &&
      "output" in part &&
      part.state === "output-available"
    ) {
      const output = part.output as Record<string, unknown>;
      if ("tmdbId" in output) {
        return output as unknown as IdentifiedMedia;
      }
    }
  }
  return null;
}

/** Strip escaped quotes from Gemini output */
function cleanAIText(text: string): string {
  return text.replace(/\\"/g, '"').replace(/\\'/g, "'");
}

function getFriendlyErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("quota") || lower.includes("rate limit") || lower.includes("rate-limit") || lower.includes("429") || lower.includes("too many")) {
    // Parse retry duration from Gemini errors like "Please retry in 55.373324254s"
    const retryMatch = raw.match(/retry in ([\d.]+)s/i);
    const retryAfterHeader = raw.match(/Retry-After:\s*(\d+)/i);
    const seconds = retryMatch
      ? Math.ceil(Number(retryMatch[1]))
      : retryAfterHeader
        ? Number(retryAfterHeader[1])
        : null;
    const waitText = seconds
      ? seconds >= 60
        ? `Try again in ${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) > 1 ? "s" : ""}.`
        : `Try again in ${seconds} second${seconds !== 1 ? "s" : ""}.`
      : "Please try again in a few minutes.";
    return `AI recommendations are temporarily unavailable due to high demand. ${waitText}`;
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout")) {
    return "Couldn't reach the AI service. Check your connection and try again.";
  }
  if (lower.includes("authentication") || lower.includes("401")) {
    return "Your session has expired. Please refresh the page and sign in again.";
  }
  return "Something went wrong generating recommendations. Please try again.";
}

const MOOD_SUGGESTIONS = [
  "I want to feel inspired and motivated",
  "Something cozy for a rainy evening",
  "I need a good laugh right now",
  "In the mood for something mind-bending",
  "Feeling nostalgic and sentimental",
  "I want an edge-of-my-seat thriller",
] as const;

export function MoodSection() {
  const router = useRouter();
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
    clearError,
    genreSuggestion,
  } = useMoodChat();

  const isStreaming = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  // Auto-scroll chat area when new content arrives
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, status]);

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2 || trimmed.length > 500 || isStreaming) return;
    sendMessage({ text: trimmed });
  };

  const handleReset = () => {
    setMessages([]);
    clearError();
  };

  const handleShowMovies = () => {
    if (!genreSuggestion?.genres) return;
    const genreIds = genreSuggestion.genres.map((g) => g.id).join(",");
    const mood = encodeURIComponent(genreSuggestion.moodSummary);
    const mediaType = genreSuggestion.media_type ?? "movie";
    let url = `/home/recommendations?genres=${genreIds}&mood=${mood}&type=${mediaType}`;
    if (genreSuggestion.origin_country) {
      url += `&origin_country=${genreSuggestion.origin_country}`;
    }
    router.push(url);
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-[0_0_20px_rgba(251,44,54,0.15)]">
            <Sparkles className="size-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">
            What are you in the mood for?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Describe how you feel and get personalized movie recommendations
            powered by AI
          </p>
        </div>

        {/* Chat area */}
        {hasMessages && (
          <div
            ref={chatAreaRef}
            className="max-h-[400px] overflow-y-auto space-y-3 px-1"
          >
            {messages.map((msg) => {
              // Extract per-message tool outputs for inline rendering
              const msgParts = msg.parts ?? [];
              const msgGenre = msg.role === "assistant" ? getMessageGenreSuggestion(msgParts) : null;
              const msgMedia = msg.role === "assistant" ? getMessageIdentifiedMedia(msgParts) : null;

              return (
                <div key={msg.id}>
                  {msg.role === "user" && (
                    <div className="flex justify-end">
                      <div className="bg-primary/15 text-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm">
                        {msgParts
                          .filter((p) => p.type === "text")
                          .map((p, i) => (
                            <span key={i}>
                              {p.type === "text" ? cleanAIText(p.text) : null}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  {msg.role === "assistant" && (
                    <div className="space-y-2">
                      <div className="flex justify-start">
                        <div className="flex gap-2.5 max-w-[85%]">
                          <div className="size-7 rounded-lg bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="size-3.5 text-primary" />
                          </div>
                          <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-foreground">
                            {msgParts
                              .filter((p) => p.type === "text")
                              .map((p, i) => (
                                <span key={i}>
                                  {p.type === "text" ? cleanAIText(p.text) : null}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>

                      {/* Identified media card — inline with this message */}
                      {msgMedia && msgMedia.verified && !isStreaming && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start pl-9"
                        >
                          <ShazamCard
                            title={msgMedia.title}
                            tmdbId={msgMedia.tmdbId}
                            mediaType={msgMedia.mediaType}
                            year={msgMedia.year}
                            posterPath={msgMedia.posterPath}
                            overview={msgMedia.overview}
                          />
                        </motion.div>
                      )}

                      {/* Genre suggestion CTA — inline with this message */}
                      {msgGenre && !isStreaming && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-center pt-1"
                        >
                          <Card className="border-primary/30 bg-primary/5 p-4 w-full max-w-sm">
                            <div className="space-y-3 text-center">
                              <div className="flex flex-wrap justify-center gap-1.5">
                                {msgGenre.genres.map((g) => {
                                  const countryLabel = msgGenre.origin_country
                                    ? COUNTRY_LABELS[msgGenre.origin_country]
                                    : undefined;
                                  return (
                                    <Badge
                                      key={g.id}
                                      variant="secondary"
                                      className="bg-primary/15 text-primary border-primary/20"
                                    >
                                      {countryLabel ? `${countryLabel} ${g.name}` : g.name}
                                    </Badge>
                                  );
                                })}
                              </div>
                              <Button
                                onClick={handleShowMovies}
                                className="gap-2 w-full"
                                size="sm"
                              >
                                {msgGenre.media_type === "tv"
                                  ? "Show me TV shows"
                                  : "Show me movies"}
                                <ArrowRight className="size-4" />
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="flex gap-2.5">
                  <div className="size-7 rounded-lg bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shrink-0">
                    <Sparkles className="size-3.5 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <Loader variant="typing" size="sm" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/5 p-4 max-w-sm mx-auto">
            <div className="flex gap-3 items-start">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2 min-w-0">
                <p className="text-sm text-foreground font-medium">
                  {getFriendlyErrorMessage(error.message)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground h-7 px-2"
                  onClick={handleReset}
                >
                  <RotateCcw className="size-3" />
                  Try again
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Input area */}
        <div className="max-w-lg mx-auto space-y-3">
          <ChatInput
            onSubmit={handleSubmit}
            isStreaming={isStreaming}
          />

          {/* Reset button when there are messages */}
          {hasMessages && !isStreaming && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="size-3" />
                Start over
              </Button>
            </div>
          )}
        </div>

        {/* Suggestion chips — only before first message */}
        {!hasMessages && !isStreaming && (
          <div className="flex flex-wrap justify-center gap-2">
            {MOOD_SUGGESTIONS.map((suggestion) => (
              <PromptSuggestion
                key={suggestion}
                className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                onClick={() => handleSubmit(suggestion)}
              >
                {suggestion}
              </PromptSuggestion>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function ChatInput({
  onSubmit,
  isStreaming,
}: {
  onSubmit: (text: string) => void;
  isStreaming: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    onSubmit(value);
    setValue("");
  };

  return (
    <PromptInput
      value={value}
      onValueChange={setValue}
      onSubmit={handleSubmit}
      isLoading={isStreaming}
      disabled={isStreaming}
      className={cn(
        "border-primary/20",
        isStreaming && "opacity-70",
      )}
    >
      <PromptInputTextarea
        placeholder="e.g., I'm feeling nostalgic and want something heartwarming..."
        disabled={isStreaming}
      />
      <PromptInputActions className="justify-end px-2 pb-1">
        <PromptInputAction tooltip="Send message">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            disabled={isStreaming}
            onClick={handleSubmit}
          >
            <ArrowRight className="size-4" />
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
