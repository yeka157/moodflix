export type SettingsFormValues = {
  displayName: string;
};

export type UserProfile = {
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

export type AccentTone = "red" | "amber" | "violet" | "emerald" | "cyan";
