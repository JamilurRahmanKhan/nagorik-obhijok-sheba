"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useT } from "@/lib/i18n";

const links = [
  { href: "/submit", label: "অভিযোগ দাখিল" },
  { href: "/track", label: "অবস্থা জানুন" },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { t } = useT();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-3 text-ink hover:text-ink">
            <Image src="/gov-logo.png" alt={t("বাংলাদেশ সরকারের প্রতীক")} width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
            <span className="leading-tight">
              <span className="block text-h3 font-bold">{t("নাগরিক অভিযোগ সেল")}</span>
              <span className="block text-caption text-muted">{t("স্থানীয় সরকার বিভাগ")}</span>
            </span>
          </Link>
          <nav aria-label={t("প্রধান মেনু")} className="flex items-center gap-1 text-small font-semibold">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="flex min-h-11 items-center rounded-control px-3 text-ink-2 hover:bg-canvas hover:text-primary">
                {t(l.label)}
              </Link>
            ))}
            <Link href="/admin" className="flex min-h-11 items-center rounded-control px-3 text-muted hover:bg-canvas hover:text-primary">
              {t("লগইন")}
            </Link>
            <LanguageToggle className="ml-2" />
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-small text-muted sm:px-6">
          <p>{t("নাগরিক অভিযোগ সেল — স্থানীয় সরকার বিভাগ")}</p>
          <p>{t("আপনার দেওয়া তথ্য কেবল অভিযোগ নিষ্পত্তির কাজে ব্যবহৃত হয়।")}</p>
        </div>
      </footer>
    </div>
  );
}
