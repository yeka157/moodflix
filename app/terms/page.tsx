import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service — Moodflix",
  description:
    "The rules and conditions for using Moodflix's movie discovery and watchlist service.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate="May 25, 2026">
      <p>
        Welcome to Moodflix. These Terms of Service (&ldquo;Terms&rdquo;)
        govern your access to and use of moodflix.app and related services
        (the &ldquo;Service&rdquo;). By creating an account or using the
        Service, you agree to these Terms. If you do not agree, do not use
        the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 13 years old to use the Service. If you are under
        the age of majority in your jurisdiction, you must have a parent or
        guardian&apos;s consent.
      </p>

      <h2>2. Your Account</h2>
      <p>
        You are responsible for safeguarding your account credentials and for
        all activity under your account. Notify us immediately at{" "}
        <a href="mailto:hello@yuliuskevin.com">hello@yuliuskevin.com</a> if
        you suspect unauthorized access.
      </p>
      <p>
        You agree to provide accurate information and keep it up to date. We
        may suspend or terminate accounts that violate these Terms or that we
        reasonably suspect of abuse.
      </p>

      <h2>3. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any illegal purpose or in violation of any laws.</li>
        <li>Scrape, copy, or redistribute Service data outside personal use.</li>
        <li>Reverse engineer, decompile, or attempt to extract the source code.</li>
        <li>Interfere with, disrupt, or place an unreasonable load on the Service.</li>
        <li>Use automated systems (bots, scrapers) without our written permission.</li>
        <li>Submit harmful, harassing, or unlawful content via the AI mood input.</li>
        <li>Attempt to bypass rate limits, authentication, or other security measures.</li>
      </ul>

      <h2>4. AI Recommendations</h2>
      <p>
        Moodflix uses AI (Google Gemini) to generate movie and series
        recommendations based on your prompts. AI output is provided
        &ldquo;as is&rdquo; and may be inaccurate, incomplete, or
        inappropriate. Do not rely on AI output for any consequential
        decisions. Free accounts are limited to 10 AI requests per day.
      </p>

      <h2>5. Movie and Series Data</h2>
      <p>
        Movie and series metadata, posters, and backdrops are provided by{" "}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          TMDB
        </a>
        . This product uses the TMDB API but is not endorsed or certified by
        TMDB. Streaming availability data is provided by JustWatch via TMDB
        and may not be accurate or current.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        The Service, including its design, code, branding, and features
        (excluding TMDB data and user content), is owned by Moodflix. You
        retain ownership of your user content (watchlist items, ratings,
        prompts). You grant us a limited license to host, store, and process
        your user content solely to operate the Service.
      </p>

      <h2>7. Pricing and Plans</h2>
      <p>
        The Service currently offers a free plan. We may introduce paid plans
        in the future. Any paid features, billing terms, and refund policies
        will be presented to you before purchase.
      </p>

      <h2>8. Modifications and Termination</h2>
      <p>
        We may modify, suspend, or discontinue the Service (or any feature) at
        any time. We will give reasonable notice for material changes that
        impact paid features. You may terminate your account at any time from{" "}
        <Link href="/settings">settings</Link>. We may terminate or suspend
        your account immediately for material breach of these Terms.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; without warranties of any kind, express or implied,
        including merchantability, fitness for a particular purpose, and
        non-infringement. We do not warrant that the Service will be
        uninterrupted, error-free, or secure.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Moodflix and its operators
        shall not be liable for any indirect, incidental, special,
        consequential, or punitive damages, or any loss of profits or
        revenues, whether incurred directly or indirectly, arising from your
        use of the Service. Our aggregate liability shall not exceed the
        greater of (a) the amount you paid us in the 12 months preceding the
        claim, or (b) USD $50.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold Moodflix harmless from any claims,
        damages, liabilities, and expenses (including reasonable legal fees)
        arising from your use of the Service, your content, or your violation
        of these Terms.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the Republic of Indonesia,
        without regard to conflict-of-law principles. Any disputes shall be
        resolved in the competent courts of Jakarta, Indonesia, unless local
        consumer protection law grants you the right to bring claims in your
        home jurisdiction.
      </p>

      <h2>13. Changes to These Terms</h2>
      <p>
        We may update these Terms. Material changes will be announced via
        email or in-app notice at least 14 days before taking effect. Your
        continued use after the effective date constitutes acceptance.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href="mailto:hello@yuliuskevin.com">hello@yuliuskevin.com</a>.
      </p>
    </LegalLayout>
  );
}
