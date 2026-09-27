"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { StatusBadge, Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";
import { Timeline } from "@/components/timeline";
import { normalizePhone } from "@/lib/bn";
import { trackComplaint, type PublicComplaint } from "@/lib/store";
import { useT } from "@/lib/i18n";

function TrackForm() {
  const params = useSearchParams();
  const { t, tt, n, dateLong } = useT();
  const [id, setId] = useState(params.get("id") ?? "");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [complaint, setComplaint] = useState<PublicComplaint | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const p = normalizePhone(phone);
    if (!id.trim()) return setError("ট্র্যাকিং আইডি লিখুন");
    if (!p) return setError("সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২-৩৪৫৬৭৮)");
    setError("");
    setBusy(true);
    try {
      const result = await trackComplaint(id.trim(), p);
      setComplaint(result);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "খুঁজে পাওয়া যায়নি — পরে আবার চেষ্টা করুন");
    } finally {
      setBusy(false);
    }
  };

  const notFound = searched && !complaint;
  const closingNote = complaint?.history.findLast((h) => (h.status === "resolved" || h.status === "rejected") && h.note)?.note;

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6 px-4 py-10 sm:py-12">
      <title>{`${t("অভিযোগের অবস্থা")} | ${t("নাগরিক অভিযোগ সেল")}`}</title>
      <div>
        <h1 className="text-h2 font-bold text-ink">{t("অভিযোগের অবস্থা জানুন")}</h1>
        <p className="mt-1.5 text-body text-muted">{t("ট্র্যাকিং আইডি এবং অভিযোগ দেওয়ার সময় ব্যবহৃত মোবাইল নম্বর লিখুন।")}</p>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("ট্র্যাকিং আইডি")} htmlFor="track-id" required>
            <Input id="track-id" value={id} onChange={(e) => setId(e.target.value)} placeholder="BD-2026-0129" autoCapitalize="characters" />
          </Field>
          <Field label={t("মোবাইল নম্বর")} htmlFor="track-phone" required>
            <Input id="track-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("০১XXX-XXXXXX")} />
          </Field>
        </div>
        {error && (
          <p role="alert" className="text-small font-medium text-st-rejected">
            {t(error)}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          <Search size={16} aria-hidden /> {busy ? t("খোঁজা হচ্ছে…") : t("খুঁজুন")}
        </Button>
      </form>

      {notFound && (
        <div role="alert" className="rounded-card border border-st-rejected bg-st-rejected-bg px-5 py-4 text-body text-st-rejected">
          {t("আইডি ও মোবাইল নম্বরের সাথে মিলে এমন কোনো অভিযোগ পাওয়া যায়নি। অনুগ্রহ করে দুটি তথ্যই আবার যাচাই করুন।")}
        </div>
      )}

      {complaint && (
        <article aria-label={t("অভিযোগের অবস্থা")} className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-5 sm:p-7">
          <header>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-small font-semibold text-muted">{complaint.id}</span>
              <StatusBadge status={complaint.status} />
            </div>
            <h2 className="mt-2 text-brand font-bold leading-snug text-ink">{complaint.subject}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-muted">
              <Pill>{complaint.category}</Pill>
              <span>{complaint.department}</span>
              <span>
                · {t("জমা")}: {dateLong(complaint.createdAt)}
              </span>
            </div>
          </header>

          <div className="border-t border-line pt-5">
            <h3 className="mb-4 text-lead font-bold text-ink">{t("অগ্রগতির অবস্থা")}</h3>
            <Timeline complaint={complaint} />
          </div>

          <dl className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-caption text-muted">{t("দায়িত্বপ্রাপ্ত কর্মকর্তা")}</dt>
              <dd className="text-body font-medium text-ink">{complaint.officerLabel ?? t("এখনও নির্ধারণ করা হয়নি")}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted">{t("সর্বশেষ হালনাগাদ")}</dt>
              <dd className="text-body font-medium text-ink">{dateLong(complaint.updatedAt)}</dd>
            </div>
          </dl>

          {closingNote && (
            <p className="rounded-control bg-canvas px-4 py-3 text-body leading-relaxed text-ink-2">
              <strong className="text-ink">{t(complaint.status === "rejected" ? "বাতিলের কারণ: " : "সমাধানের বিবরণ: ")}</strong>
              {closingNote}
            </p>
          )}

          <p className="text-caption text-muted">
            {t("অভিযোগ সম্পর্কে যোগাযোগ করতে ট্র্যাকিং আইডি")} <strong className="text-ink-2">{complaint.id}</strong> {t("উল্লেখ করুন।")}
            {complaint.attachments.length > 0 && ` ${tt("attachmentCount", { n: n(complaint.attachments.length) })}`}
          </p>
        </article>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackForm />
    </Suspense>
  );
}
