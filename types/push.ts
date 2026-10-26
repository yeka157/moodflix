export interface PushSubscriptionRecord {
  auth: string;
  createdAt: Date | null;
  endpoint: string;
  id: string;
  p256dh: string;
  userId: string;
}

export interface NotificationSubscription {
  createdAt: Date | null;
  id: string;
  lastNotifiedAt: Date | null;
  posterPath: string | null;
  releaseDate: string | null;
  title: string;
  tmdbId: number;
  userId: string;
}

export interface PushPayload {
  badge?: string;
  body: string;
  icon?: string;
  title: string;
  url: string;
}

export interface ReleaseMatch {
  catalogId: number | null;
  id: string;
  posterPath: string | null;
  title: string | null;
  tmdbId: number;
  userId: string;
}
