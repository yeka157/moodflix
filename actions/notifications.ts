"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import * as notificationsService from "@/lib/services/notifications";
import type { NotificationListPage } from "@/types/notification";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user.id;
}

export async function listNotifications(opts?: {
  cursor?: string | null;
  limit?: number;
}): Promise<NotificationListPage> {
  const userId = await requireUserId();
  return notificationsService.listNotifications(userId, opts);
}

export async function getUnreadCount(): Promise<number> {
  const userId = await requireUserId();
  return notificationsService.getUnreadCount(userId);
}

export async function markAsRead(notificationId: string): Promise<void> {
  const userId = await requireUserId();
  await notificationsService.markVisibleAsRead(userId, [notificationId]);
  revalidatePath("/notifications");
}

export async function markAllAsRead(): Promise<void> {
  const userId = await requireUserId();
  await notificationsService.markAllAsRead(userId);
  revalidatePath("/notifications");
}

export async function markVisibleAsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const userId = await requireUserId();
  await notificationsService.markVisibleAsRead(userId, ids);
  revalidatePath("/notifications");
}
