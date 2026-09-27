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

/** Latin digits (or a number) → Bengali digits. */
export function toBn(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** Bengali digits → Latin digits (for parsing user input). */
export function toEn(value: string): string {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
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

/** "২২-০৯-২০২৬" — used in tables. */
export function fmtDateShort(iso: string): string {
  const p = dhakaParts(iso);
  const dd = String(p.day).padStart(2, "0");
  const mm = String(p.month + 1).padStart(2, "0");
  return toBn(`${dd}-${mm}-${p.year}`);
}

/** "১৯ সেপ্টেম্বর, ২০২৬" — used in detail views. */
export function fmtDateLong(iso: string): string {
  const p = dhakaParts(iso);
  return `${toBn(p.day)} ${BN_MONTHS[p.month]}, ${toBn(p.year)}`;
}

/** "১৯ সেপ্টেম্বর, ২০২৬, দুপুর ০২:৩০" */
export function fmtDateTime(iso: string): string {
  const { hour: h, minute } = dhakaParts(iso);
  const period = h < 4 ? "রাত" : h < 12 ? "সকাল" : h < 16 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(minute).padStart(2, "0");
  return `${fmtDateLong(iso)}, ${period} ${toBn(String(h12).padStart(2, "0"))}:${toBn(mm)}`;
}

/** 01712345678 → ০১৭১২-৩৪৫৬৭৮ (matches the design). */
export function fmtPhone(phone: string): string {
  const p = toEn(phone).replace(/\D/g, "");
  if (p.length === 11) return toBn(`${p.slice(0, 5)}-${p.slice(5)}`);
  return toBn(phone);
}

/** Accepts Bengali/Latin digits, spaces, dashes, +88 prefix. Returns 01XXXXXXXXX or null. */
export function normalizePhone(input: string): string | null {
  let p = toEn(input).replace(/[\s-]/g, "");
  if (p.startsWith("+88")) p = p.slice(3);
  else if (p.startsWith("88") && p.length === 13) p = p.slice(2);
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

export function fmtNumber(n: number, digits = 0): string {
  return toBn(n.toFixed(digits));
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
