export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date | null;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  lastNotifiedAt: Date | null;
  createdAt: Date | null;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
}
