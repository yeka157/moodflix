"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";
import { updateDisplayName } from "@/actions/profile";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";
import type { SettingsFormValues } from "@/types/settings";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "privacy", label: "Privacy" },
  { id: "subscription", label: "Subscription" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

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

const TONES = ["red", "amber", "violet", "emerald", "cyan"] as const;

const SET_CARD =
  "bg-card border border-border rounded-[20px] px-7 py-6 mb-[18px]";
const SET_CARD_HEADING = "m-0 mb-1 text-[17px] font-semibold text-foreground";
const SET_CARD_HELP = "m-0 mb-[18px] text-muted-foreground text-[13px] leading-[1.55]";
const EYEBROW =
  "font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground";
const INPUT_CLASSES =
  "w-full px-3.5 py-[11px] bg-background border border-border rounded-[10px] text-[13.5px] text-foreground transition-colors focus:border-[var(--line-strong)] outline-none disabled:opacity-70 aria-[invalid=true]:border-primary placeholder:text-muted-foreground";
const LABEL_CLASSES = "block text-xs font-medium mb-1.5 text-[var(--ink-2)]";
const BTN_BASE =
  "inline-flex items-center gap-2 px-5 py-[11px] rounded-full text-[13px] font-medium tracking-[0.01em] transition-[transform,background-color,color,border-color] duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-60";
const BTN_RED = `${BTN_BASE} bg-primary text-white hover:bg-[var(--red-deep)]`;
const BTN_OUTLINE = `${BTN_BASE} border border-[var(--line-strong)] text-foreground bg-transparent hover:bg-card`;

export function SettingsForm({
  displayName,
  email,
  avatarUrl,
}: SettingsFormProps) {
  const [section, setSection] = useState<SectionId>("profile");
  const [isPending, startTransition] = useTransition();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  // Client-only preferences persisted in localStorage
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [grain, setGrain] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [showWatched, setShowWatched] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = (key: string, def: boolean) => {
      const v = localStorage.getItem(`mf:${key}`);
      return v === null ? def : v === "1";
    };
    setReducedMotion(stored("reducedMotion", false));
    setAutoplay(stored("autoplay", true));
    setGrain(stored("grain", true));
    setPublicProfile(stored("publicProfile", false));
    setShowWatched(stored("showWatched", true));
    setAnalytics(stored("analytics", true));
  }, []);

  function persist(key: string, value: boolean) {
    localStorage.setItem(`mf:${key}`, value ? "1" : "0");
  }

  useEffect(() => {
    document.body.classList.toggle("no-grain", !grain);
  }, [grain]);

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
    defaultValues: { displayName },
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
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-7 md:gap-14 max-w-[1000px]">
      <aside className="flex md:flex-col gap-1 md:gap-0.5 md:sticky md:top-[100px] md:self-start overflow-x-auto md:overflow-visible">
        <div className={cn(EYEBROW, "px-3.5 pb-3 hidden md:block")}>
          Navigate
        </div>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            data-active={section === s.id ? "true" : undefined}
            className="px-3.5 py-2.5 rounded-lg text-[13.5px] text-muted-foreground transition-[color,background-color] duration-150 hover:text-foreground hover:bg-card cursor-pointer no-underline whitespace-nowrap data-[active=true]:text-foreground data-[active=true]:bg-card"
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </a>
        ))}
      </aside>

      <div>
        {section === "profile" && (
          <>
            <div className={SET_CARD}>
              <div className="flex gap-6 items-center flex-wrap">
                {avatarUrl ? (
                  <div className="relative w-[88px] h-[88px] rounded-full overflow-hidden shadow-[0_12px_24px_rgba(0,0,0,0.4)]">
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-[88px] h-[88px] rounded-full grid place-items-center text-white font-semibold text-[28px] shadow-[0_12px_24px_rgba(0,0,0,0.4)] bg-[linear-gradient(135deg,var(--violet),var(--red))]">
                    {initial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="m-0 mb-1 text-xl text-foreground font-semibold">
                    {displayName}
                  </h3>
                  <p className="text-[13px] text-muted-foreground m-0">
                    {email}
                  </p>
                  <div className="flex gap-2 mt-3.5">
                    <button
                      type="button"
                      className={BTN_OUTLINE}
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <LogOut size={14} />
                      )}
                      {isLoggingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={SET_CARD}>
              <h3 className={SET_CARD_HEADING}>Account</h3>
              <p className={SET_CARD_HELP}>Your basic details. We don&apos;t share these.</p>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label htmlFor="displayName" className={LABEL_CLASSES}>
                      Display name
                    </label>
                    <input
                      id="displayName"
                      placeholder="Enter your name"
                      aria-invalid={errors.displayName ? "true" : "false"}
                      className={INPUT_CLASSES}
                      {...register("displayName")}
                    />
                    {errors.displayName && (
                      <p className="text-xs text-primary mt-1.5">
                        {errors.displayName.message}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email-readonly" className={LABEL_CLASSES}>
                      Email
                    </label>
                    <input
                      id="email-readonly"
                      value={email}
                      readOnly
                      disabled
                      className={cn(INPUT_CLASSES, "opacity-70")}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className={cn(BTN_RED, "mt-1")}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  {isPending ? "Saving…" : "Save changes"}
                </button>
              </form>
            </div>
          </>
        )}

        {section === "appearance" && (
          <>
            <div className={SET_CARD}>
              <h3 className={SET_CARD_HEADING}>Accent color</h3>
              <p className={SET_CARD_HELP}>
                Visual preference only — preview swatch (theme accent stays
                crimson app-wide).
              </p>
              <div className="flex gap-3 flex-wrap">
                {TONES.map((t) => (
                  <div
                    key={t}
                    className={cn(
                      "w-14 h-14 rounded-xl border-[3px]",
                      t === "red" ? "border-foreground" : "border-card"
                    )}
                    style={{ background: `var(--${t})` }}
                    aria-label={t}
                  />
                ))}
              </div>
            </div>

            <div className={SET_CARD}>
              <h3 className={SET_CARD_HEADING}>Motion &amp; texture</h3>
              <p className={SET_CARD_HELP}>Tune visual intensity to your preference.</p>
              <ToggleRow
                label="Film grain overlay"
                desc="Adds subtle SVG noise across the app."
                on={grain}
                onChange={(v) => {
                  setGrain(v);
                  persist("grain", v);
                }}
              />
              <ToggleRow
                label="Reduced motion"
                desc="Disable parallax and large transitions."
                on={reducedMotion}
                onChange={(v) => {
                  setReducedMotion(v);
                  persist("reducedMotion", v);
                }}
              />
              <ToggleRow
                label="Autoplay trailers on hover"
                desc="Plays short trailer when hovering posters."
                on={autoplay}
                onChange={(v) => {
                  setAutoplay(v);
                  persist("autoplay", v);
                }}
              />
            </div>
          </>
        )}

        {section === "privacy" && (
          <div className={SET_CARD}>
            <h3 className={SET_CARD_HEADING}>Privacy</h3>
            <p className={SET_CARD_HELP}>Control what others can see.</p>
            <ToggleRow
              label="Public profile"
              desc="Anyone can find you by username."
              on={publicProfile}
              onChange={(v) => {
                setPublicProfile(v);
                persist("publicProfile", v);
              }}
            />
            <ToggleRow
              label="Show watched list"
              desc="Visible on your public profile."
              on={showWatched}
              onChange={(v) => {
                setShowWatched(v);
                persist("showWatched", v);
              }}
            />
            <ToggleRow
              label="Anonymous usage analytics"
              desc="Helps us improve recommendations."
              on={analytics}
              onChange={(v) => {
                setAnalytics(v);
                persist("analytics", v);
              }}
            />
          </div>
        )}

        {section === "subscription" && (
          <div className={SET_CARD}>
            <h3 className={SET_CARD_HEADING}>Subscription</h3>
            <p className={SET_CARD_HELP}>
              You&apos;re on the{" "}
              <strong className="text-foreground">Free</strong> plan.
            </p>
            <div className="p-5 rounded-[14px] border border-[var(--line-strong)] mb-4 bg-[linear-gradient(135deg,rgba(255,59,63,0.14),transparent)]">
              <div className={cn(EYEBROW, "text-primary mb-2")}>
                ● ACTIVE
              </div>
              <div className="font-display text-[36px] leading-[0.9] mb-2 uppercase">
                $0 / forever
              </div>
              <div className="text-[13px] text-muted-foreground">
                Unlimited library · 10 AI picks per day
              </div>
            </div>
            <button type="button" className={BTN_OUTLINE} disabled>
              Upgrade to Critic — coming soon
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  on,
  onChange,
}: {
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-b-0 gap-4">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-[12.5px] text-muted-foreground mt-1 leading-[1.5]">
          {desc}
        </div>
      </div>
      <button
        type="button"
        className={cn("switch", on && "on")}
        onClick={() => onChange(!on)}
        aria-label={label}
        aria-pressed={on}
      />
    </div>
  );
}
