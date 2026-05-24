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
import { ShazamCardList } from "@/components/ai/shazam-card";
import { COUNTRY_LABELS } from "@/lib/constants";
import type { GenreSuggestion, IdentifiedMediaResult } from "@/types/ai";
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

/** Extract identified media result from a single message's parts */
function getMessageIdentifiedMedia(parts: MessageParts): IdentifiedMediaResult | null {
  for (const part of parts) {
    if (
      part.type.startsWith("tool-") &&
      "output" in part &&
      part.state === "output-available"
    ) {
      const output = part.output as Record<string, unknown>;
      if ("matches" in output && Array.isArray(output.matches)) {
        return output as unknown as IdentifiedMediaResult;
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
    <div className="mood reveal">
      <div className="mood-eyebrow">
        <span className="pulse" />
        AI MOOD · LIVE
      </div>
      <h2 className="mood-title">
        Tell me your <span className="it">mood,</span>
        <br />
        I&apos;ll tell you what to watch.
      </h2>
      <div className="mood-body space-y-4">

        {/* Chat area — transcript style */}
        {hasMessages && (
          <div
            ref={chatAreaRef}
            className="mt-7 pt-7 border-t border-border flex flex-col gap-7 max-h-[640px] overflow-y-auto"
          >
            {messages.map((msg, mi) => {
              const msgParts = msg.parts ?? [];
              const msgGenre = msg.role === "assistant" ? getMessageGenreSuggestion(msgParts) : null;
              const msgMedia = msg.role === "assistant" ? getMessageIdentifiedMedia(msgParts) : null;
              const text = msgParts
                .filter((p) => p.type === "text")
                .map((p) => (p.type === "text" ? cleanAIText(p.text) : ""))
                .join("");

              return (
                <div key={msg.id}>
                  {msg.role === "user" && (
                    <div className="ai-msg-user relative pl-9">
                      <p className="font-serif italic text-[26px] leading-[1.35] text-foreground max-w-[720px] m-0">
                        {text}
                      </p>
                      <div className="font-mono text-[11px] text-muted-foreground tracking-[0.12em] uppercase mt-2.5 flex items-center gap-2.5">
                        <span className="w-[22px] h-px bg-[var(--ink-4)]" />
                        YOU · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  )}
                  {msg.role === "assistant" && (
                    <div className="grid grid-cols-[36px_1fr] gap-[18px] items-start">
                      <div className="ai-badge">
                        <Sparkles />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 font-mono text-[11px] text-muted-foreground tracking-[0.12em] uppercase mb-3.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[pulse-ring_1.8s_infinite] shadow-[0_0_0_0_rgba(255,59,63,0.6)]" />
                          <span className="text-foreground">MOODFLIX AI</span>
                          <span>·</span>
                          <span>{msgMedia ? "IDENTIFYING" : "CURATING"}</span>
                        </div>
                        {text && (
                          <p className="text-[17px] leading-[1.55] text-foreground m-0 mb-4 max-w-[720px]">
                            {text}
                            {isStreaming && mi === messages.length - 1 && (
                              <span className="ai-cursor inline-block w-px h-[1em] bg-primary align-text-bottom ml-0.5" />
                            )}
                          </p>
                        )}

                        {msgMedia && msgMedia.matches.length > 0 && !isStreaming && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <ShazamCardList matches={msgMedia.matches} query={msgMedia.query} />
                          </motion.div>
                        )}

                        {msgGenre && !isStreaming && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 flex flex-col gap-[18px] max-w-[720px]"
                          >
                            <div>
                              <div className="flex gap-2 font-mono text-[11px] text-muted-foreground tracking-[0.1em] mb-2.5">
                                <span>· DETECTED GENRES</span>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {msgGenre.genres.map((g, i) => {
                                  const countryLabel = msgGenre.origin_country
                                    ? COUNTRY_LABELS[msgGenre.origin_country]
                                    : undefined;
                                  return (
                                    <span
                                      key={g.id}
                                      className="ai-genre"
                                      style={{ animationDelay: `${i * 0.1}s` }}
                                    >
                                      <span className="w-[5px] h-[5px] rounded-full bg-primary" />
                                      {countryLabel ? `${countryLabel} ${g.name}` : g.name}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex gap-2.5 items-center flex-wrap">
                              <button
                                type="button"
                                className="btn btn-red"
                                onClick={handleShowMovies}
                              >
                                {msgGenre.media_type === "tv"
                                  ? "Show me TV shows"
                                  : "Show me the picks"}
                                <ArrowRight size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={handleReset}
                              >
                                Start over
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming indicator (no text yet) */}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="grid grid-cols-[36px_1fr] gap-[18px] items-start">
                <div className="ai-badge">
                  <Sparkles />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 font-mono text-[11px] text-muted-foreground tracking-[0.12em] uppercase mb-3.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[pulse-ring_1.8s_infinite] shadow-[0_0_0_0_rgba(255,59,63,0.6)]" />
                    <span className="text-foreground">MOODFLIX AI</span>
                    <span>·</span>
                    <span>CURATING</span>
                  </div>
                  <div className="flex items-center gap-3.5 text-[var(--ink-2)] font-mono text-xs tracking-[0.08em]">
                    <span className="ai-reel" />
                    reading the room…
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
    </div>
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
