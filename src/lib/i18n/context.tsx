"use client";

import { useSyncExternalStore } from "react";

export type Lang = "bn" | "en";

const KEY = "ngc:lang";
const DEFAULT_LANG: Lang = "bn";

let lang: Lang = DEFAULT_LANG;
let loaded = false;
const listeners = new Set<() => void>();

function load(): Lang {
  if (loaded) return lang;
  loaded = true;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "bn") lang = saved;
  } catch {
    /* localStorage unavailable — stays on the default */
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang;
  return lang;
}

function getSnapshot(): Lang {
  return load();
}

function getServerSnapshot(): Lang {
  return DEFAULT_LANG;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLang(next: Lang) {
  lang = next;
  loaded = true;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* preference just won't persist across reloads */
  }
  document.documentElement.lang = next;
  listeners.forEach((l) => l());
}

/**
 * Reads/writes the app-wide language preference. No React Context needed — this is the
 * same "module-level store + useSyncExternalStore" pattern as src/lib/store.ts and
 * src/lib/auth.ts, so it's consistent with the rest of the app and needs no provider.
 */
export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { lang: value, setLang };
}

/** Kept for compatibility with call sites that wrap the tree; it no longer does anything itself. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return children;
}
