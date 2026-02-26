export type SettingsFormValues = {
  username: string;
};

export type UserProfile = {
  email: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
};
