"use client";

import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { login, useSession } from "@/lib/auth";
import { useDb } from "@/lib/store";
import { useT } from "@/lib/i18n";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const { settings } = useDb();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const next = params.get("next");
  const target = next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin";

  useEffect(() => {
    if (session) router.replace(target);
  }, [session, router, target]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) return setError("ইমেইল ও পাসওয়ার্ড দিন");
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.replace(target);
  };

  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <title>{`${t("লগইন")} | ${t("নাগরিক অভিযোগ সেল")}`}</title>
      <section className="flex flex-col justify-between gap-10 bg-side px-6 py-8 text-side-text sm:px-12 sm:py-12">
        <div className="flex items-center gap-3">
          <Image src="/gov-logo.png" alt={t("বাংলাদেশ সরকারের প্রতীক")} width={48} height={48} className="size-12 shrink-0 rounded-full object-cover" />
          <div>
            <div className="text-h2 font-bold text-white">{settings.orgName}</div>
            <div className="mt-1 text-small text-side-muted">{settings.orgSub}</div>
          </div>
        </div>
        <div className="max-w-md">
          <p className="text-title font-bold leading-snug text-white">{t("প্রতিটি অভিযোগ ট্র্যাকে থাকুক, প্রতিটি নাগরিক উত্তর পান।")}</p>
          <p className="mt-3 text-body leading-relaxed text-side-muted">
            {t("অভিযোগ গ্রহণ, কর্মকর্তা নির্ধারণ, অগ্রগতি পর্যবেক্ষণ ও প্রতিবেদন — সব এক জায়গায়।")}
          </p>
        </div>
        <Link href="/" className="hidden text-small font-semibold text-side-text underline-offset-4 hover:text-white hover:underline lg:inline">
          {t("← নাগরিক পোর্টালে ফিরে যান")}
        </Link>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-small font-semibold text-primary">
              <ShieldCheck size={18} aria-hidden /> {t("কর্মকর্তা প্রবেশ")}
            </div>
            <LanguageToggle />
          </div>
          <h1 className="text-title font-bold text-ink">{t("লগইন করুন")}</h1>
          <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4 rounded-panel border border-line bg-surface p-6">
            <Field label={t("ইমেইল")} htmlFor="email" required>
              <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={t("পাসওয়ার্ড")} htmlFor="password" required>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? t("পাসওয়ার্ড লুকান") : t("পাসওয়ার্ড দেখুন")}
                  className="absolute right-0 top-0 flex size-11 items-center justify-center text-muted hover:text-ink"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {error && (
              <p role="alert" className="rounded-control bg-st-rejected-bg px-3 py-2 text-small font-medium text-st-rejected">
                {t(error)}
              </p>
            )}
            <Button type="submit" disabled={busy} className="py-3 text-lead font-bold">
              {t("প্রবেশ করুন")}
            </Button>
          </form>

          <p className="mt-4 text-caption text-muted">
            {t("অ্যাডমিন অ্যাকাউন্ট সার্ভারের এনভায়রনমেন্ট ভেরিয়েবলে (ADMIN_EMAIL, ADMIN_PASSWORD) নির্ধারিত — দেখুন README।")}
          </p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
