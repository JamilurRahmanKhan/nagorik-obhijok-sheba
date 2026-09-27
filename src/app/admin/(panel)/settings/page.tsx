"use client";

import { Download, Plus, RotateCcw, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea, controlClass } from "@/components/ui/fields";
import { Skeleton } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/auth";
import { toBn } from "@/lib/bn";
import { PRIORITIES, PRIORITY_META } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { resetDemoData, updateSettings, useDb } from "@/lib/store";
import type { Complaint, Officer, Priority, Settings } from "@/lib/types";

function ListEditor({
  label,
  id,
  items,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  id: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  error?: string;
}) {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");

  const add = () => {
    const v = value.trim();
    if (!v) return;
    if (items.some((i) => i === v)) return setMsg("এটি ইতোমধ্যে তালিকায় আছে");
    onChange([...items, v]);
    setValue("");
    setMsg("");
  };

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-small font-semibold text-ink" id={`${id}-label`}>
        {label}
      </span>
      <ul aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-1 rounded-full border border-line bg-canvas py-1 pl-3.5 pr-1 text-small text-ink">
            {it}
            <button
              type="button"
              onClick={() => items.length > 1 && onChange(items.filter((x) => x !== it))}
              disabled={items.length <= 1}
              aria-label={`${it} সরান`}
              className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-line hover:text-st-rejected disabled:opacity-40"
            >
              <X size={15} />
            </button>
          </li>
        ))}
      </ul>
      {/* not a <form>: this editor lives inside the settings form */}
      <div className="flex gap-2">
        <label htmlFor={id} className="sr-only">
          {label} যুক্ত করুন
        </label>
        <input
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={cn(controlClass, "max-w-sm")}
        />
        <Button variant="outline" onClick={add} aria-label={`${label} যুক্ত করুন`}>
          <Plus size={16} /> যুক্ত
        </Button>
      </div>
      {(msg || error) && (
        <p role="alert" className="text-caption font-medium text-st-rejected">
          {msg || error}
        </p>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-body font-medium text-ink">{label}</div>
        {hint && <div className="text-caption text-muted">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="flex min-h-11 shrink-0 items-center"
      >
        <span className={cn("relative h-6 w-10 rounded-full transition-colors duration-150", checked ? "bg-primary" : "bg-line-strong")}>
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-all duration-150", checked ? "left-[18px]" : "left-0.5")} />
        </span>
      </button>
    </div>
  );
}

function SettingsForm({
  initial,
  complaints,
  officers,
}: {
  initial: Settings;
  complaints: Complaint[];
  officers: Officer[];
}) {
  const toast = useToast();
  const session = useSession();
  const [s, setS] = useState<Settings>(initial);
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!s.orgName.trim()) return setError("প্রতিষ্ঠানের নাম দিতে হবে");
    if (PRIORITIES.some((p) => !Number.isFinite(s.slaDays[p]) || s.slaDays[p] < 1 || s.slaDays[p] > 90))
      return setError("সময়সীমা ১ থেকে ৯০ দিনের মধ্যে হতে হবে");
    setError("");
    setBusy(true);
    try {
      await updateSettings({ ...s, orgName: s.orgName.trim(), orgSub: s.orgSub.trim() });
      toast("সেটিংস সংরক্ষিত হয়েছে");
    } catch (err) {
      setError(err instanceof Error ? err.message : "সংরক্ষণ করা যায়নি");
    } finally {
      setBusy(false);
    }
  };

  const backup = () => {
    const data = { version: 1, complaints, officers, settings: s };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ngc-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tplField = (key: keyof Settings["smsTemplates"], label: string) => (
    <Field label={label} htmlFor={`tpl-${key}`}>
      <Textarea
        id={`tpl-${key}`}
        rows={3}
        value={s.smsTemplates[key]}
        onChange={(e) => setS({ ...s, smsTemplates: { ...s.smsTemplates, [key]: e.target.value } })}
      />
    </Field>
  );

  return (
    <form onSubmit={save} noValidate className="flex max-w-[860px] flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <CardTitle className="mb-0">প্রতিষ্ঠানের তথ্য</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="সেলের নাম" htmlFor="orgName" required>
            <Input id="orgName" value={s.orgName} onChange={(e) => setS({ ...s, orgName: e.target.value })} />
          </Field>
          <Field label="মন্ত্রণালয়/বিভাগ" htmlFor="orgSub">
            <Input id="orgSub" value={s.orgSub} onChange={(e) => setS({ ...s, orgSub: e.target.value })} />
          </Field>
        </div>
        {session && (
          <p className="rounded-control bg-canvas px-3 py-2 text-small text-muted">
            লগইন করা অ্যাকাউন্ট: <strong className="text-ink">{session.name}</strong> ({session.role}) · {session.email}
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle className="mb-1">সমাধানের নির্ধারিত সময়সীমা</CardTitle>
          <p className="text-small text-muted">এই সময়ের মধ্যে সমাধান না হলে অভিযোগ “অতিক্রান্ত” হিসেবে চিহ্নিত হবে।</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {PRIORITIES.map((p: Priority) => (
            <Field key={p} label={`${PRIORITY_META[p].label} (দিন)`} htmlFor={`sla-${p}`}>
              <Input
                id={`sla-${p}`}
                type="number"
                min={1}
                max={90}
                inputMode="numeric"
                value={Number.isFinite(s.slaDays[p]) ? s.slaDays[p] : ""}
                onChange={(e) => setS({ ...s, slaDays: { ...s.slaDays, [p]: e.target.value === "" ? NaN : Number(e.target.value) } })}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-6">
        <div>
          <CardTitle className="mb-1">বিভাগ ও দপ্তর</CardTitle>
          <p className="text-small text-muted">নাগরিক ফর্মে যে তালিকা দেখানো হয়। মুছলেও পুরনো অভিযোগ অপরিবর্তিত থাকবে।</p>
        </div>
        <ListEditor id="cat" label="অভিযোগের বিভাগ" items={s.categories} onChange={(categories) => setS({ ...s, categories })} placeholder="নতুন বিভাগের নাম" />
        <ListEditor id="dep" label="দপ্তর" items={s.departments} onChange={(departments) => setS({ ...s, departments })} placeholder="নতুন দপ্তরের নাম" />
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle className="mb-1">SMS বিজ্ঞপ্তি</CardTitle>
          <p className="text-small text-muted">
            বার্তায় <code className="rounded bg-canvas px-1">{"{id}"}</code> ও <code className="rounded bg-canvas px-1">{"{officer}"}</code> ব্যবহার করা যায়। ডেমো মোডে বার্তাগুলো কেবল অভিযোগের কার্যবিবরণীতে সংরক্ষিত হয় — বাস্তব গেটওয়ে সংযুক্ত নেই।
          </p>
        </div>
        <Toggle label="অভিযোগ জমার সময় নাগরিককে SMS" checked={s.smsOnSubmit} onChange={(v) => setS({ ...s, smsOnSubmit: v })} />
        <Toggle
          label="কর্মকর্তা নির্ধারণ ও সমাধানের সময় SMS"
          hint="স্ট্যাটাস পরিবর্তনে স্বয়ংক্রিয়ভাবে পাঠানো হবে"
          checked={s.smsOnStatusChange}
          onChange={(v) => setS({ ...s, smsOnStatusChange: v })}
        />
        {tplField("received", "অভিযোগ গৃহীত")}
        {tplField("assigned", "কর্মকর্তা নির্ধারিত")}
        {tplField("resolved", "সমাধান সম্পন্ন")}
      </Card>

      <Card className="flex flex-col gap-3">
        <CardTitle className="mb-0">ডেটা</CardTitle>
        <p className="text-small text-muted">সব তথ্য ডেটাবেসে নিরাপদে সংরক্ষিত থাকে। প্রয়োজনে ব্যাকআপ নিন বা ডেমো ডেটা ফিরিয়ে আনুন।</p>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={backup}>
            <Download size={16} /> ব্যাকআপ (JSON)
          </Button>
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <RotateCcw size={16} /> ডেমো ডেটা পুনরুদ্ধার
          </Button>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-card sm:border sm:bg-surface">
        <Button type="submit" disabled={!dirty || busy}>
          সংরক্ষণ করুন
        </Button>
        {dirty && (
          <Button variant="ghost" onClick={() => setS(initial)} disabled={busy}>
            পরিবর্তন বাতিল
          </Button>
        )}
        <span className="text-small text-muted" aria-live="polite">
          {dirty ? "সংরক্ষণ না করা পরিবর্তন আছে" : "সব পরিবর্তন সংরক্ষিত"}
        </span>
        {error && (
          <span role="alert" className="text-small font-medium text-st-rejected">
            {error}
          </span>
        )}
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="ডেমো ডেটা পুনরুদ্ধার করবেন?">
        <p className="text-body text-ink-2">
          বর্তমান সব অভিযোগ, কর্মকর্তা ও সেটিংস মুছে গিয়ে প্রাথমিক ডেমো ডেটা ফিরে আসবে ({toBn(complaints.length)}টি অভিযোগ বর্তমানে আছে)। এটি ফেরানো যাবে না — প্রয়োজনে আগে ব্যাকআপ নিন।
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setResetOpen(false)} disabled={resetBusy}>
            বাতিল
          </Button>
          <Button
            variant="danger"
            disabled={resetBusy}
            onClick={async () => {
              setResetBusy(true);
              try {
                await resetDemoData();
                toast("ডেমো ডেটা পুনরুদ্ধার হয়েছে");
              } catch (err) {
                toast(err instanceof Error ? err.message : "পুনরুদ্ধার করা যায়নি", "error");
              } finally {
                setResetBusy(false);
                setResetOpen(false);
              }
            }}
          >
            হ্যাঁ, পুনরুদ্ধার করুন
          </Button>
        </div>
      </Modal>
    </form>
  );
}

export default function SettingsPage() {
  const { settings, complaints, officers, loading } = useDb();
  return (
    <>
      <PageHeader title="সেটিংস" subtitle="বিভাগ, সময়সীমা ও বিজ্ঞপ্তির নিয়ম পরিচালনা করুন" />
      {!loading ? (
        // re-key when settings are replaced externally (e.g. demo reset)
        <SettingsForm key={JSON.stringify(settings).length} initial={settings} complaints={complaints} officers={officers} />
      ) : (
        <div className="flex max-w-[860px] flex-col gap-5" role="status" aria-label="লোড হচ্ছে">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}
    </>
  );
}
