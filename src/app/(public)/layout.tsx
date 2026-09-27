import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/submit", label: "অভিযোগ দাখিল" },
  { href: "/track", label: "অবস্থা জানুন" },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-3 text-ink hover:text-ink">
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-full bg-primary text-h3 font-bold text-white"
            >
              বা
            </span>
            <span className="leading-tight">
              <span className="block text-h3 font-bold">নাগরিক অভিযোগ সেল</span>
              <span className="block text-caption text-muted">স্থানীয় সরকার বিভাগ</span>
            </span>
          </Link>
          <nav aria-label="প্রধান মেনু" className="flex items-center gap-1 text-small font-semibold">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="flex min-h-11 items-center rounded-control px-3 text-ink-2 hover:bg-canvas hover:text-primary">
                {l.label}
              </Link>
            ))}
            <Link href="/admin" className="flex min-h-11 items-center rounded-control px-3 text-muted hover:bg-canvas hover:text-primary">
              কর্মকর্তা লগইন
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-small text-muted sm:px-6">
          <p>নাগরিক অভিযোগ সেল — স্থানীয় সরকার বিভাগ</p>
          <p>আপনার দেওয়া তথ্য কেবল অভিযোগ নিষ্পত্তির কাজে ব্যবহৃত হয়।</p>
        </div>
      </footer>
    </div>
  );
}
