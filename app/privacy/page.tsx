import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy — Moodflix",
  description:
    "How Moodflix collects, uses, and protects your data when you use our movie discovery service.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="May 25, 2026">
      <p>
        This Privacy Policy explains how Moodflix (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, and shares
        information about you when you use moodflix.app and related services
        (the &ldquo;Service&rdquo;).
      </p>

      <h2>1. Information We Collect</h2>
      <h3>Account information</h3>
      <p>
        When you create an account we collect your email address, display name,
        and (if you sign in with Google) your Google profile name and avatar
        URL. Passwords are hashed by our authentication provider and never
        accessible to us in plain text.
      </p>
      <h3>Usage data</h3>
      <p>
        We store the movies and series you add to your watchlist, your ratings
        (like/dislike), watch status, and AI mood prompts you submit. These are
        tied to your account and used to power the Service.
      </p>
      <h3>Technical data</h3>
      <p>
        We collect IP address, browser type, device type, approximate location
        (country, derived from IP via Vercel headers), and request logs needed
        to operate, secure, and improve the Service.
      </p>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>Provide and maintain the Service (authentication, watchlist sync, AI recommendations).</li>
        <li>Personalize movie and series recommendations based on your activity.</li>
        <li>Send service-related notifications (push notifications, if you opt in).</li>
        <li>Detect, prevent, and respond to fraud, abuse, and security incidents.</li>
        <li>Comply with legal obligations.</li>
      </ul>

      <h2>3. Third-Party Services</h2>
      <p>We use the following processors to operate the Service:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication, database, file storage.
        </li>
        <li>
          <strong>Google</strong> — OAuth sign-in (we receive your email,
          name, profile picture).
        </li>
        <li>
          <strong>Google Gemini (via Vercel AI SDK)</strong> — processes your
          mood prompts to generate recommendations. Prompts are sent to Google
          for inference.
        </li>
        <li>
          <strong>TMDB (The Movie Database)</strong> — movie and series
          metadata, posters, backdrops, watch-provider data.
        </li>
        <li>
          <strong>Vercel</strong> — hosting, edge functions, analytics.
        </li>
        <li>
          <strong>Sentry</strong> — error tracking and performance monitoring.
        </li>
      </ul>
      <p>
        Each of these services has its own privacy policy governing how they
        handle data they receive.
      </p>

      <h2>4. Data Sharing</h2>
      <p>
        We do not sell your personal information. We share data only with the
        processors listed above, when required by law, or in connection with a
        merger, acquisition, or asset sale (with notice to you).
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain account data for as long as your account is active. You can
        delete your account at any time from{" "}
        <Link href="/settings">settings</Link>; this removes your profile,
        watchlist, ratings, and AI history. Backups may retain residual copies
        for up to 30 days.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        Depending on your jurisdiction (including GDPR for EU/EEA residents,
        UU PDP for Indonesian residents, and CCPA for California residents),
        you may have the right to:
      </p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>Delete your account and associated data.</li>
        <li>Export your data in a portable format.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Withdraw consent (where processing is based on consent).</li>
      </ul>
      <p>
        To exercise any of these rights, email us at{" "}
        <a href="mailto:hello@yuliuskevin.com">hello@yuliuskevin.com</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        We use industry-standard measures including TLS encryption in transit,
        encrypted database storage at rest, hashed passwords, and Row Level
        Security policies that prevent cross-account data access. No method of
        transmission or storage is 100% secure; we cannot guarantee absolute
        security.
      </p>

      <h2>8. Children</h2>
      <p>
        The Service is not directed at children under 13. We do not knowingly
        collect personal data from children under 13. If you believe a child
        has provided us data, contact us and we will delete it.
      </p>

      <h2>9. International Transfers</h2>
      <p>
        Our processors operate globally. By using the Service, you consent to
        your data being transferred to and processed in countries outside your
        country of residence, including the United States.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this policy. Material changes will be announced via
        email or in-app notice at least 14 days before taking effect. Your
        continued use of the Service after the effective date constitutes
        acceptance.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions or requests? Email{" "}
        <a href="mailto:hello@yuliuskevin.com">hello@yuliuskevin.com</a>.
      </p>
    </LegalLayout>
  );
}
