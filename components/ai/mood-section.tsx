"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
    if (!genreSuggestion) return;
    const genreIds = genreSuggestion.genres.map((g) => g.id).join(",");
    const mood = encodeURIComponent(genreSuggestion.moodSummary);
    router.push(`/home/recommendations?genres=${genreIds}&mood=${mood}`);
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
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
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-primary/15 text-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm">
                      {msg.parts
                        .filter((p) => p.type === "text")
                        .map((p, i) => (
                          <span key={i}>
                            {p.type === "text" ? p.text : null}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
                {msg.role === "assistant" && (
                  <div className="flex justify-start">
                    <div className="flex gap-2.5 max-w-[85%]">
                      <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="size-3.5 text-primary" />
                      </div>
                      <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-foreground">
                        {msg.parts
                          .filter((p) => p.type === "text")
                          .map((p, i) => (
                            <span key={i}>
                              {p.type === "text" ? p.text : null}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="flex gap-2.5">
                  <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="size-3.5 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <Loader variant="typing" size="sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Genre suggestion CTA */}
            <AnimatePresence>
              {genreSuggestion && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center pt-2"
                >
                  <Card className="border-primary/30 bg-primary/5 p-4 w-full max-w-sm">
                    <div className="space-y-3 text-center">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {genreSuggestion.genres.map((g) => (
                          <Badge
                            key={g.id}
                            variant="secondary"
                            className="bg-primary/15 text-primary border-primary/20"
                          >
                            {g.name}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        onClick={handleShowMovies}
                        className="gap-2 w-full"
                        size="sm"
                      >
                        Show me movies
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center text-center space-y-2 py-2">
            <AlertCircle className="size-6 text-destructive" />
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
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
  const inputRef = useRef<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleValueChange = (value: string) => {
    inputRef.current = value;
  };

  const handleSubmit = () => {
    onSubmit(inputRef.current);
    // Clear input after submit by resetting the PromptInput value
    inputRef.current = "";
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }
  };

  return (
    <PromptInput
      onSubmit={handleSubmit}
      onValueChange={handleValueChange}
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
            <Sparkles className="size-4" />
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
