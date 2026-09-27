"use client";

import { fillTemplate } from "@/lib/format";
import { fmtDateLong, fmtDateShort, fmtDateTime, fmtNum, fmtPhone } from "@/lib/bn";
import { DICTIONARY } from "./dictionary";
import { TEMPLATES } from "./templates";
import { useLang, type Lang } from "./context";

export type { Lang } from "./context";
export { LanguageProvider, useLang } from "./context";

/**
 * The app's whole translation surface. One hook call gives every component the current
 * language plus every helper it needs — so switching a component to be translatable is
 * just: import `useT` instead of the raw formatters, call `t(...)` around static strings,
 * and pass `lang` into date/number formatters instead of using their old bn-only defaults.
 */
export function useT() {
  const { lang, setLang } = useLang();

  /** Static string lookup — pass the Bengali source text; falls back to it if untranslated. */
  const t = (bn: string): string => (lang === "en" ? (DICTIONARY[bn] ?? bn) : bn);

  /** Parameterized string lookup (see src/lib/i18n/templates.ts). `vars` values should already be language-formatted (e.g. via `n`). */
  const tt = (key: string, vars: Record<string, string | number> = {}): string => {
    const entry = TEMPLATES[key];
    if (!entry) return key;
    return fillTemplate(entry[lang], Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, String(v)])));
  };

  /** Shorthand for formatting a number/digit-string in the current language. */
  const n = (value: string | number) => fmtNum(value, lang);

  return {
    lang,
    setLang,
    t,
    tt,
    n,
    dateShort: (iso: string) => fmtDateShort(iso, lang),
    dateLong: (iso: string) => fmtDateLong(iso, lang),
    dateTime: (iso: string) => fmtDateTime(iso, lang),
    phone: (p: string) => fmtPhone(p, lang),
  };
}

export function otherLang(lang: Lang): Lang {
  return lang === "bn" ? "en" : "bn";
}
