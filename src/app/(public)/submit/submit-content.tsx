"use client";

import { ComplaintForm } from "@/components/complaint-form";
import { useT } from "@/lib/i18n";

export function SubmitContent() {
  const { t } = useT();
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col items-center px-4 py-10 sm:py-12">
      <title>{`${t("অভিযোগ দাখিল")} | ${t("নাগরিক অভিযোগ সেল")}`}</title>
      <div
        aria-hidden
        className="mb-4 flex size-[76px] items-center justify-center rounded-full bg-primary text-title font-bold text-white"
      >
        বা
      </div>
      <h1 className="text-center text-h2 font-bold text-ink">{t("নাগরিক অভিযোগ দাখিল ফরম")}</h1>
      <p className="mb-8 mt-1.5 max-w-[480px] text-center text-body text-muted">
        {t("আপনার অভিযোগ আমাদের কাছে গুরুত্বপূর্ণ — নিচের তথ্যগুলো পূরণ করুন")}
      </p>
      <div className="w-full">
        <ComplaintForm mode="public" />
      </div>
    </div>
  );
}
