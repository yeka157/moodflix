export type NotificationType = "release" | "ai_event" | "system";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  posterPath: string | null;
  href: string | null;
  tmdbId: number | null;
  mediaType: "movie" | "tv" | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListPage = {
  items: Notification[];
  nextCursor: string | null;
};
