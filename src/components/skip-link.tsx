"use client";

import { useT } from "@/lib/i18n";

export function SkipLink() {
  const { t } = useT();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
    >
      {t("মূল অংশে যান")}
    </a>
  );
}
