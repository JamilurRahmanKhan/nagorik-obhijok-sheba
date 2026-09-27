"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { QuickTrack } from "@/components/public/quick-track";
import { useT } from "@/lib/i18n";

const steps = [
  { title: "অভিযোগ জমা দিন", body: "দপ্তর ও ধরন বেছে সমস্যাটি লিখুন। ছবি বা পিডিএফ থাকলে যুক্ত করুন। জমা দিলেই একটি ট্র্যাকিং আইডি পাবেন।" },
  { title: "পর্যালোচনা", body: "সেলের কর্মকর্তা অভিযোগটি যাচাই করে সঠিক দপ্তর ও অগ্রাধিকার নির্ধারণ করেন।" },
  { title: "কর্মকর্তা নির্ধারণ", body: "সংশ্লিষ্ট দপ্তরের একজন কর্মকর্তাকে দায়িত্ব দেওয়া হয় — আপনি ট্র্যাকিং পেজে তার পদবি ও নাম দেখতে পাবেন।" },
  { title: "সমাধান ও জানানো", body: "সমাধান সম্পন্ন হলে স্ট্যাটাস হালনাগাদ হয় এবং আপনার মোবাইলে SMS যায়।" },
];

const topics = [
  ["রাস্তা ও অবকাঠামো", "গর্ত, ভাঙা ফুটপাত, নষ্ট স্ট্রিট লাইট, খোলা ম্যানহোল"],
  ["পানি সরবরাহ", "পানি না আসা, চাপ কম, ঘোলা পানি, লাইন ফেটে যাওয়া"],
  ["বিদ্যুৎ", "ঘন ঘন লোডশেডিং, ভুল বিল, ঝুলন্ত তার, ট্রান্সফরমার"],
  ["গ্যাস সংযোগ", "চাপ কম, নতুন সংযোগে বিলম্ব, লিকেজ"],
  ["বর্জ্য ব্যবস্থাপনা ও ড্রেনেজ", "ময়লা অপসারণ না হওয়া, ড্রেন বন্ধ, জলাবদ্ধতা"],
  ["লাইসেন্স ও নিবন্ধন", "ট্রেড লাইসেন্স, জন্ম-মৃত্যু নিবন্ধনে বিলম্ব বা ভুল"],
  ["দুর্নীতি ও হয়রানি", "সেবা পেতে ঘুষ দাবি, অনিয়মিত ফি, অবহেলা"],
];

const faqs = [
  { q: "কী ধরনের অভিযোগ এখানে করা যায়?", a: "স্থানীয় সরকার সংশ্লিষ্ট নাগরিক সেবা — রাস্তা, পানি, বিদ্যুৎ, গ্যাস, বর্জ্য, লাইসেন্স, নিবন্ধন ইত্যাদি। এখতিয়ারের বাইরের অভিযোগ হলে আমরা কারণসহ জানিয়ে দিই।" },
  { q: "সমাধানে সাধারণত কত সময় লাগে?", a: "অগ্রাধিকার অনুযায়ী নির্ধারিত সময়সীমা আছে — জরুরি ও ঝুঁকিপূর্ণ বিষয় দ্রুত, সাধারণ বিষয় তুলনামূলক বেশি সময়ে নিষ্পত্তি হয়। বর্তমান অবস্থা যেকোনো সময় ট্র্যাকিং পেজে দেখা যায়।" },
  { q: "ট্র্যাকিং আইডি হারিয়ে ফেললে?", a: "আইডি ছাড়া অবস্থা দেখা যায় না। জমা দেওয়ার সময় আইডি কপি বা লিখে রাখুন। হারিয়ে গেলে আপনার মোবাইল নম্বরসহ সেলে যোগাযোগ করুন।" },
  { q: "আমার তথ্য কি গোপন থাকবে?", a: "আপনার নাম, মোবাইল ও ঠিকানা কেবল অভিযোগ নিষ্পত্তির কাজে সংশ্লিষ্ট কর্মকর্তারা দেখতে পান। ট্র্যাকিংয়ের জন্য আইডির সাথে আপনার মোবাইল নম্বরও মিলাতে হয়।" },
];

export default function HomePage() {
  const { t, n } = useT();
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto grid w-full max-w-[1120px] items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:py-20">
          <div>
            <p className="mb-3 text-small font-semibold text-primary">{t("স্থানীয় সরকার বিভাগ · নাগরিক অভিযোগ সেল")}</p>
            <h1 className="text-[clamp(28px,4.2vw,44px)] font-bold leading-[1.35] text-ink">
              {t("আপনার অভিযোগ জানান।")}
              <br />
              {t("সমাধানের প্রতিটি ধাপ নিজে দেখুন।")}
            </h1>
            <p className="mt-4 max-w-xl text-lead leading-relaxed text-ink-2">
              {t("সরকারি সেবা নিয়ে সমস্যায় পড়লে অনলাইনে অভিযোগ জমা দিন। একটি ট্র্যাকিং আইডির মাধ্যমে দেখে নিন কে দায়িত্বে আছেন এবং কাজ কোন পর্যায়ে।")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/submit" className="py-3 text-lead">
                {t("অভিযোগ দাখিল করুন")} <ArrowRight size={18} aria-hidden />
              </LinkButton>
              <LinkButton href="/track" variant="outline" className="py-3 text-lead">
                {t("অবস্থা জানুন")}
              </LinkButton>
            </div>
          </div>

          <div className="rounded-panel bg-side p-6 sm:p-8">
            <h2 className="text-brand font-bold text-white">{t("অভিযোগের অবস্থা জানুন")}</h2>
            <p className="mb-5 mt-1 text-small leading-relaxed text-side-muted">
              {t("জমা দেওয়ার সময় পাওয়া ট্র্যাকিং আইডি লিখুন। পরের ধাপে আপনার মোবাইল নম্বর যাচাই করা হবে।")}
            </p>
            <QuickTrack />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1120px] px-4 py-14 sm:px-6">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <h2 className="text-h2 font-bold text-ink">{t("কীভাবে কাজ করে")}</h2>
            <p className="mt-2 max-w-xs text-body text-muted">{t("চারটি স্পষ্ট ধাপ — প্রতিটি ধাপ আপনি ট্র্যাকিং পেজে দেখতে পাবেন।")}</p>
          </div>
          <ol className="flex flex-col">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4 border-t border-line py-5 first:border-t-0 first:pt-0">
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-body font-bold text-primary">
                  {n(i + 1)}
                </span>
                <div>
                  <h3 className="text-h3 font-bold text-ink">{t(s.title)}</h3>
                  <p className="mt-1 text-body leading-relaxed text-ink-2">{t(s.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-14 sm:px-6">
          <h2 className="text-h2 font-bold text-ink">{t("কোন বিষয়ে অভিযোগ করবেন")}</h2>
          <dl className="mt-6 grid gap-x-12 md:grid-cols-2">
            {topics.map(([topic, desc]) => (
              <div key={topic} className="border-t border-line py-4">
                <dt className="text-h3 font-bold text-ink">{t(topic)}</dt>
                <dd className="mt-0.5 text-body text-muted">{t(desc)}</dd>
              </div>
            ))}
          </dl>
          <Link href="/submit" className="mt-6 inline-flex min-h-11 items-center gap-1.5 font-semibold">
            {t("অভিযোগ দাখিল করুন")} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[820px] px-4 py-14 sm:px-6">
        <h2 className="mb-5 text-h2 font-bold text-ink">{t("সাধারণ জিজ্ঞাসা")}</h2>
        <div className="flex flex-col gap-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-card border border-line bg-surface">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-h3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {t(f.q)}
                <span aria-hidden className="text-h2 font-normal text-primary transition-transform duration-150 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-5 pb-4 text-body leading-relaxed text-ink-2">{t(f.a)}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
