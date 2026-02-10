import { createClient } from "@/lib/supabase/server";
import { FeatureCardGrid } from "@/components/layout/feature-card-grid";
import { MoodSection } from "@/components/ai/mood-section";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user?.email?.split("@")[0] || "Explorer";

  const featureCards = [
    {
      href: "/discover",
      icon: "Compass",
      title: "Discover Movies",
      description:
        "Browse trending movies and search for your next favorite film",
    },
    {
      href: "/watchlist",
      icon: "Bookmark",
      title: "Your Watchlist",
      description:
        "Track movies you want to watch, are watching, and have finished",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">{displayName}</p>
      </div>

      {/* AI Mood Section */}
      <MoodSection />

      {/* Feature Cards */}
      <FeatureCardGrid cards={featureCards} />
    </div>
  );
}
