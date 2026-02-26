"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateUsername } from "@/actions/profile";
import type { SettingsFormValues } from "@/types/settings";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const usernameSchema = z.object({
  username: z
    .string()
    .max(30, "Username must be 30 characters or less")
    .regex(
      /^[a-zA-Z0-9_-]*$/,
      "Only letters, numbers, hyphens, and underscores",
    ),
});

interface SettingsFormProps {
  currentUsername: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export function SettingsForm({
  currentUsername,
  displayName,
  email,
  avatarUrl,
}: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: currentUsername,
    },
  });

  function onSubmit(data: SettingsFormValues) {
    startTransition(async () => {
      const result = await updateUsername(data.username);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Username updated");
      }
    });
  }

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {avatarUrl ? (
            <div className="relative size-16 overflow-hidden rounded-full shrink-0">
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ) : (
            <Avatar className="size-16 shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <p className="text-base font-medium truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Username form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Username</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter a username"
                {...register("username")}
                className="max-w-sm"
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                2-30 characters. Letters, numbers, hyphens, and underscores only.
              </p>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
