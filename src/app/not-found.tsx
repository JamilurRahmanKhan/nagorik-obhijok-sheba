"use client";

import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const { t, n } = useT();
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-stat font-bold text-primary">{n(404)}</p>
      <h1 className="text-h2 font-bold text-ink">{t("পৃষ্ঠাটি খুঁজে পাওয়া যায়নি")}</h1>
      <p className="max-w-sm text-body text-muted">{t("আপনি যে ঠিকানাটি খুঁজছেন সেটি সরানো হয়েছে বা ভুল লেখা হয়েছে।")}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <LinkButton href="/">{t("হোমে ফিরে যান")}</LinkButton>
        <LinkButton href="/track" variant="outline">
          {t("অভিযোগের অবস্থা জানুন")}
        </LinkButton>
      </div>
      <Link href="/admin" className="mt-4 text-small text-muted">
        {t("লগইন")}
      </Link>
    </main>
  );
}
