"use client";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, controlClass } from "@/components/ui/fields";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { initial, normalizePhone } from "@/lib/bn";
import { cn } from "@/lib/cn";
import { openLoad, removeOfficer, saveOfficer, useDb } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { Officer } from "@/lib/types";

interface FormState {
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  active: boolean;
}

const EMPTY: FormState = { name: "", designation: "", department: "", phone: "", email: "", active: true };

function OfficerForm({
  initialValue,
  editingId,
  onDone,
}: {
  initialValue: FormState;
  editingId?: string;
  onDone: () => void;
}) {
  const { settings } = useDb();
  const toast = useToast();
  const { t } = useT();
  const [f, setF] = useState<FormState>(initialValue);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const err: typeof errors = {};
    if (f.name.trim().length < 2) err.name = "কর্মকর্তার নাম লিখুন";
    if (!f.designation.trim()) err.designation = "পদবি লিখুন";
    if (!f.department) err.department = "দপ্তর নির্বাচন করুন";
    const phone = normalizePhone(f.phone);
    if (!phone) err.phone = "সঠিক মোবাইল নম্বর দিন";
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) err.email = "ইমেইল ঠিকানা সঠিক নয়";
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      await saveOfficer(
        { name: f.name.trim(), designation: f.designation.trim(), department: f.department, phone: phone!, email: f.email.trim(), active: f.active },
        editingId,
      );
      toast(editingId ? t("কর্মকর্তার তথ্য হালনাগাদ হয়েছে") : t("নতুন কর্মকর্তা যুক্ত হয়েছে"));
      onDone();
    } catch (err2) {
      toast(t(err2 instanceof Error ? err2.message : "সংরক্ষণ করা যায়নি"), "error");
    } finally {
      setBusy(false);
    }
  };

  const inv = (k: keyof FormState) => ({
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `of-${k}-error` : undefined,
  });
  const err = (k: keyof FormState) => (errors[k] ? t(errors[k]!) : undefined);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("নাম")} htmlFor="of-name" required error={err("name")}>
          <Input id="of-name" value={f.name} onChange={(e) => set("name", e.target.value)} {...inv("name")} />
        </Field>
        <Field label={t("পদবি")} htmlFor="of-designation" required error={err("designation")}>
          <Input id="of-designation" value={f.designation} onChange={(e) => set("designation", e.target.value)} placeholder={t("যেমন: সহকারী প্রকৌশলী")} {...inv("designation")} />
        </Field>
      </div>
      <Field label={t("দপ্তর")} htmlFor="of-department" required error={err("department")}>
        <Select id="of-department" value={f.department} onChange={(e) => set("department", e.target.value)} {...inv("department")}>
          <option value="">{t("নির্বাচন করুন")}</option>
          {settings.departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
          {f.department && !settings.departments.includes(f.department) && <option>{f.department}</option>}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("মোবাইল")} htmlFor="of-phone" required error={err("phone")}>
          <Input id="of-phone" type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder={t("০১XXX-XXXXXX")} {...inv("phone")} />
        </Field>
        <Field label={t("ইমেইল (ঐচ্ছিক)")} htmlFor="of-email" error={err("email")}>
          <Input id="of-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} {...inv("email")} />
        </Field>
      </div>
      <label className="flex min-h-11 items-center gap-2.5 text-body text-ink">
        <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-primary" />
        {t("সক্রিয় (নতুন অভিযোগে নির্ধারণ করা যাবে)")}
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onDone}>
          {t("বাতিল করুন")}
        </Button>
        <Button type="submit" disabled={busy}>
          {editingId ? t("সংরক্ষণ করুন") : t("যুক্ত করুন")}
        </Button>
      </div>
    </form>
  );
}

export default function OfficersPage() {
  const db = useDb();
  const { t, tt, n, phone: fmtPhoneL } = useT();
  const hydrated = !db.loading;
  const toast = useToast();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [modal, setModal] = useState<{ officer?: Officer } | null>(null);
  const [confirm, setConfirm] = useState<Officer | null>(null);

  const stats = useMemo(() => {
    const done = new Map<string, number>();
    db.complaints.forEach((c) => c.status === "resolved" && c.officerId && done.set(c.officerId, (done.get(c.officerId) ?? 0) + 1));
    return done;
  }, [db.complaints]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return db.officers
      .filter((o) => (!dept || o.department === dept) && (!needle || `${o.name} ${o.designation} ${o.email}`.toLowerCase().includes(needle)))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "bn"));
  }, [db.officers, q, dept]);

  const activeCount = db.officers.filter((o) => o.active).length;

  const toggle = async (o: Officer) => {
    const { id, ...rest } = o;
    try {
      await saveOfficer({ ...rest, active: !o.active }, id);
      toast(tt(o.active ? "officerDeactivated" : "officerActivated", { name: o.name }));
    } catch (err) {
      toast(t(err instanceof Error ? err.message : "হালনাগাদ করা যায়নি"), "error");
    }
  };

  const doRemove = async () => {
    if (!confirm) return;
    const name = confirm.name;
    try {
      await removeOfficer(confirm.id);
      toast(tt("officerDeleted", { name }));
    } catch (err) {
      toast(t(err instanceof Error ? err.message : "মুছে ফেলা যায়নি"), "error");
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      <PageHeader
        title={t("কর্মকর্তা ব্যবস্থাপনা")}
        subtitle={hydrated ? tt("officersSummary", { total: n(db.officers.length), active: n(activeCount) }) : t("কর্মকর্তা যুক্ত করুন, সম্পাদনা করুন এবং কাজের চাপ দেখুন")}
        actions={
          <Button onClick={() => setModal({})}>
            <Plus size={16} /> {t("নতুন কর্মকর্তা")}
          </Button>
        }
      />

      <div className="grid gap-3 rounded-card border border-line bg-surface p-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("নাম বা পদবি দিয়ে খুঁজুন")}
            aria-label={t("কর্মকর্তা খুঁজুন")}
            className={cn(controlClass, "pl-9")}
          />
        </div>
        <select aria-label={t("দপ্তর")} value={dept} onChange={(e) => setDept(e.target.value)} className={controlClass}>
          <option value="">{t("সব দপ্তর")}</option>
          {db.settings.departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {!hydrated ? (
          <div className="flex flex-col gap-3 p-4" role="status" aria-label={t("লোড হচ্ছে")}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState title={t("কোনো কর্মকর্তা পাওয়া যায়নি")} hint={t("সার্চ শব্দ বা দপ্তর ফিল্টার পরিবর্তন করুন, অথবা নতুন কর্মকর্তা যুক্ত করুন।")} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-body">
                <caption className="sr-only">{t("কর্মকর্তাদের তালিকা")}</caption>
                <thead>
                  <tr className="bg-canvas">
                    {["কর্মকর্তা", "দপ্তর", "যোগাযোগ", "চলমান", "সমাধান", "অবস্থা", "অ্যাকশন"].map((h) => (
                      <th key={h} scope="col" className="px-4 py-3.5 text-left text-caption font-semibold text-muted">
                        {t(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id} className={cn("border-t border-line", !o.active && "bg-canvas/50")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-body font-bold text-white", o.active ? "bg-primary" : "bg-faint")}>
                            {initial(o.name)}
                          </span>
                          <div>
                            <div className="font-semibold text-ink">{o.name}</div>
                            <div className="text-caption text-muted">{o.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-2">{o.department}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="text-ink">{fmtPhoneL(o.phone)}</div>
                        <div className="text-caption text-muted">{o.email || "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{n(openLoad(db, o.id))}</td>
                      <td className="px-4 py-3 text-ink">{n(stats.get(o.id) ?? 0)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={o.active}
                          aria-label={`${o.name} — ${t(o.active ? "সক্রিয়" : "নিষ্ক্রিয়")}`}
                          onClick={() => toggle(o)}
                          className="group flex min-h-11 items-center gap-2 text-small font-semibold"
                        >
                          <span className={cn("relative h-6 w-10 rounded-full transition-colors duration-150", o.active ? "bg-primary" : "bg-line-strong")}>
                            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-all duration-150", o.active ? "left-[18px]" : "left-0.5")} />
                          </span>
                          <span className={o.active ? "text-primary" : "text-muted"}>{t(o.active ? "সক্রিয়" : "নিষ্ক্রিয়")}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setModal({ officer: o })} aria-label={tt("editName", { name: o.name })} className="flex size-11 items-center justify-center rounded-control text-muted hover:bg-canvas hover:text-primary">
                            <Pencil size={17} />
                          </button>
                          <button type="button" onClick={() => setConfirm(o)} aria-label={tt("deleteName", { name: o.name })} className="flex size-11 items-center justify-center rounded-control text-muted hover:bg-st-rejected-bg hover:text-st-rejected">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="md:hidden">
              {list.map((o) => (
                <li key={o.id} className={cn("border-t border-line px-4 py-4 first:border-t-0", !o.active && "bg-canvas/50")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink">{o.name}</div>
                      <div className="text-caption text-muted">
                        {o.designation} · {o.department}
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-caption font-semibold", o.active ? "bg-primary-tint text-primary" : "bg-line text-muted")}>
                      {t(o.active ? "সক্রিয়" : "নিষ্ক্রিয়")}
                    </span>
                  </div>
                  <p className="mt-2 text-small text-ink-2">
                    {fmtPhoneL(o.phone)} · {t("চলমান")} {n(openLoad(db, o.id))} · {t("সমাধান")} {n(stats.get(o.id) ?? 0)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="outline" className="px-3 py-1.5 text-small" onClick={() => setModal({ officer: o })}>
                      {t("সম্পাদনা")}
                    </Button>
                    <Button variant="ghost" className="px-3 py-1.5 text-small" onClick={() => toggle(o)}>
                      {t(o.active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন")}
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5 text-small" onClick={() => setConfirm(o)}>
                      {t("মুছুন")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={t(modal?.officer ? "কর্মকর্তার তথ্য সম্পাদনা" : "নতুন কর্মকর্তা যুক্ত করুন")}>
        {modal && (
          <OfficerForm
            key={modal.officer?.id ?? "new"}
            editingId={modal.officer?.id}
            initialValue={modal.officer ? { ...modal.officer } : EMPTY}
            onDone={() => setModal(null)}
          />
        )}
      </Modal>

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title={t("কর্মকর্তাকে মুছে ফেলবেন?")}>
        <p className="text-body text-ink-2">
          <strong>{confirm?.name}</strong>
          {t("-কে তালিকা থেকে স্থায়ীভাবে মুছে ফেলা হবে। যার নামে অভিযোগ যুক্ত আছে তাকে মুছা যায় না — সেক্ষেত্রে “নিষ্ক্রিয়” করুন।")}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            {t("বাতিল করুন")}
          </Button>
          <Button variant="danger" onClick={doRemove}>
            {t("মুছে ফেলুন")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
