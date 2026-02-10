"use client";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MoodSection() {
  return (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="size-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            What are you in the mood for?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Describe how you feel and get personalized movie recommendations
            powered by AI
          </p>
        </div>
        <div className="flex w-full max-w-lg gap-2">
          <Input
            placeholder="e.g., I'm feeling nostalgic and want something heartwarming..."
            className="flex-1"
            disabled
          />
          <Button disabled>
            <Sparkles className="size-4 mr-2" />
            Recommend
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Coming soon</p>
      </div>
    </Card>
  );
}
