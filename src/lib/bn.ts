import type { Lang } from "./i18n/context";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Latin digits (or a number) → Bengali digits. */
export function toBn(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** Bengali digits → Latin digits (for parsing user input). */
export function toEn(value: string): string {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/** Number/digit-string, formatted for the given language (Bengali numerals, or plain Latin). */
export function fmtNum(value: string | number, lang: Lang = "bn"): string {
  return lang === "en" ? String(value) : toBn(value);
}

const DHAKA_OFFSET_MS = 6 * 3_600_000;

/** Calendar parts of an instant in Asia/Dhaka, independent of the viewer's timezone. */
export function dhakaParts(input: string | Date | number) {
  const d = new Date(new Date(input).getTime() + DHAKA_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(), // 0-based
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** "২২-০৯-২০২৬" (bn) or "22 Sep 2026" (en) — used in tables. */
export function fmtDateShort(iso: string, lang: Lang = "bn"): string {
  const p = dhakaParts(iso);
  if (lang === "en") return `${String(p.day).padStart(2, "0")} ${EN_MONTHS[p.month].slice(0, 3)} ${p.year}`;
  const dd = String(p.day).padStart(2, "0");
  const mm = String(p.month + 1).padStart(2, "0");
  return toBn(`${dd}-${mm}-${p.year}`);
}

/** "১৯ সেপ্টেম্বর, ২০২৬" (bn) or "19 September, 2026" (en) — used in detail views. */
export function fmtDateLong(iso: string, lang: Lang = "bn"): string {
  const p = dhakaParts(iso);
  if (lang === "en") return `${p.day} ${EN_MONTHS[p.month]}, ${p.year}`;
  return `${toBn(p.day)} ${BN_MONTHS[p.month]}, ${toBn(p.year)}`;
}

/** "১৯ সেপ্টেম্বর, ২০২৬, দুপুর ০২:৩০" (bn) or "19 September, 2026, 02:30 PM" (en) */
export function fmtDateTime(iso: string, lang: Lang = "bn"): string {
  const { hour: h, minute } = dhakaParts(iso);
  const mm = String(minute).padStart(2, "0");
  if (lang === "en") {
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const period = h < 12 ? "AM" : "PM";
    return `${fmtDateLong(iso, "en")}, ${String(h12).padStart(2, "0")}:${mm} ${period}`;
  }
  const period = h < 4 ? "রাত" : h < 12 ? "সকাল" : h < 16 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${fmtDateLong(iso, "bn")}, ${period} ${toBn(String(h12).padStart(2, "0"))}:${toBn(mm)}`;
}

/** 01712345678 → ০১৭১২-৩৪৫৬৭৮ (bn) or 01712-345678 (en). */
export function fmtPhone(phone: string, lang: Lang = "bn"): string {
  const p = toEn(phone).replace(/\D/g, "");
  const formatted = p.length === 11 ? `${p.slice(0, 5)}-${p.slice(5)}` : phone;
  return lang === "en" ? formatted : toBn(formatted);
}

/** Accepts Bengali/Latin digits, spaces, dashes, +88 prefix. Returns 01XXXXXXXXX or null. */
export function normalizePhone(input: string): string | null {
  let p = toEn(input).replace(/[\s-]/g, "");
  if (p.startsWith("+88")) p = p.slice(3);
  else if (p.startsWith("88") && p.length === 13) p = p.slice(2);
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

export function fmtNumber(n: number, digits = 0, lang: Lang = "bn"): string {
  return fmtNum(n.toFixed(digits), lang);
}

/** Days between two dates, floor. */
export function daysBetween(fromIso: string, to: Date | string = new Date()): number {
  const a = new Date(fromIso).getTime();
  const b = (typeof to === "string" ? new Date(to) : to).getTime();
  return Math.floor((b - a) / 86_400_000);
}

export function initial(name: string): string {
  const cleaned = name
    .replace(/^(মো\.|মোঃ|ডা\.|প্রকৌশলী|সহকারী প্রকৌশলী|ইন্সপেক্টর|জনাব|মিসেস|মিস)\s*/u, "")
    .trim();
  return Array.from(cleaned || name)[0] ?? "?";
}
