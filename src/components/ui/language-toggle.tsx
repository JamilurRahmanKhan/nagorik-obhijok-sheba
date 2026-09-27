"use client";

import { Languages } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * বাং / EN segmented toggle. Works anywhere in the app — it just reads/writes the shared
 * language context, so switching it on one page changes every other page immediately.
 */
export function LanguageToggle({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const { lang, setLang } = useT();
  const dark = tone === "dark";

  const btn = (value: "bn" | "en", label: string) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      className={cn(
        "min-h-8 rounded-[6px] px-2.5 text-caption font-semibold transition-colors duration-150",
        lang === value
          ? "bg-primary text-on-primary"
          : dark
            ? "text-side-muted hover:text-white"
            : "text-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      role="group"
      aria-label="ভাষা নির্বাচন / Choose language"
      className={cn(
        "flex min-h-11 shrink-0 items-center gap-0.5 rounded-control border p-1",
        dark ? "border-side-line bg-side-active/40" : "border-line bg-surface",
        className,
      )}
    >
      <Languages size={14} aria-hidden className={cn("ml-1 mr-0.5 shrink-0", dark ? "text-side-muted" : "text-faint")} />
      {btn("bn", "বাং")}
      {btn("en", "EN")}
    </div>
  );
}
