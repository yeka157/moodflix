"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { updateDisplayName } from "@/actions/profile";
import { logout } from "@/actions/auth";
import type { SettingsFormValues } from "@/types/settings";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be 50 characters or less"),
});

interface SettingsFormProps {
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export function SettingsForm({
  displayName,
  email,
  avatarUrl,
}: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  function handleLogout() {
    startLogoutTransition(async () => {
      await logout();
    });
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName,
    },
  });

  function onSubmit(data: SettingsFormValues) {
    startTransition(async () => {
      const result = await updateDisplayName(data.displayName);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Display name updated");
      }
    });
  }

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
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
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Enter your name"
              {...register("displayName")}
              aria-invalid={errors.displayName ? "true" : "false"}
              className="max-w-sm"
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">
                {errors.displayName.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-2"
          >
            <LogOut className="size-4" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
