"use client";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, controlClass } from "@/components/ui/fields";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { fmtPhone, initial, normalizePhone, toBn } from "@/lib/bn";
import { cn } from "@/lib/cn";
import { openLoad, removeOfficer, saveOfficer, useDb } from "@/lib/store";
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
      toast(editingId ? "কর্মকর্তার তথ্য হালনাগাদ হয়েছে" : "নতুন কর্মকর্তা যুক্ত হয়েছে");
      onDone();
    } catch (err2) {
      toast(err2 instanceof Error ? err2.message : "সংরক্ষণ করা যায়নি", "error");
    } finally {
      setBusy(false);
    }
  };

  const inv = (k: keyof FormState) => ({
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `of-${k}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="নাম" htmlFor="of-name" required error={errors.name}>
          <Input id="of-name" value={f.name} onChange={(e) => set("name", e.target.value)} {...inv("name")} />
        </Field>
        <Field label="পদবি" htmlFor="of-designation" required error={errors.designation}>
          <Input id="of-designation" value={f.designation} onChange={(e) => set("designation", e.target.value)} placeholder="যেমন: সহকারী প্রকৌশলী" {...inv("designation")} />
        </Field>
      </div>
      <Field label="দপ্তর" htmlFor="of-department" required error={errors.department}>
        <Select id="of-department" value={f.department} onChange={(e) => set("department", e.target.value)} {...inv("department")}>
          <option value="">নির্বাচন করুন</option>
          {settings.departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
          {f.department && !settings.departments.includes(f.department) && <option>{f.department}</option>}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="মোবাইল" htmlFor="of-phone" required error={errors.phone}>
          <Input id="of-phone" type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="০১XXX-XXXXXX" {...inv("phone")} />
        </Field>
        <Field label="ইমেইল (ঐচ্ছিক)" htmlFor="of-email" error={errors.email}>
          <Input id="of-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} {...inv("email")} />
        </Field>
      </div>
      <label className="flex min-h-11 items-center gap-2.5 text-body text-ink">
        <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-primary" />
        সক্রিয় (নতুন অভিযোগে নির্ধারণ করা যাবে)
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onDone}>
          বাতিল
        </Button>
        <Button type="submit" disabled={busy}>
          {editingId ? "সংরক্ষণ করুন" : "যুক্ত করুন"}
        </Button>
      </div>
    </form>
  );
}

export default function OfficersPage() {
  const db = useDb();
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
    const n = q.trim().toLowerCase();
    return db.officers
      .filter((o) => (!dept || o.department === dept) && (!n || `${o.name} ${o.designation} ${o.email}`.toLowerCase().includes(n)))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "bn"));
  }, [db.officers, q, dept]);

  const activeCount = db.officers.filter((o) => o.active).length;

  const toggle = async (o: Officer) => {
    const { id, ...rest } = o;
    try {
      await saveOfficer({ ...rest, active: !o.active }, id);
      toast(o.active ? `${o.name} নিষ্ক্রিয় করা হয়েছে` : `${o.name} সক্রিয় করা হয়েছে`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "হালনাগাদ করা যায়নি", "error");
    }
  };

  const doRemove = async () => {
    if (!confirm) return;
    const name = confirm.name;
    try {
      await removeOfficer(confirm.id);
      toast(`${name}-কে মুছে ফেলা হয়েছে`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "মুছে ফেলা যায়নি", "error");
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      <PageHeader
        title="কর্মকর্তা ব্যবস্থাপনা"
        subtitle={hydrated ? `মোট ${toBn(db.officers.length)} জন কর্মকর্তা, সক্রিয় ${toBn(activeCount)} জন` : "কর্মকর্তা যুক্ত করুন, সম্পাদনা করুন এবং কাজের চাপ দেখুন"}
        actions={
          <Button onClick={() => setModal({})}>
            <Plus size={16} /> নতুন কর্মকর্তা
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
            placeholder="নাম বা পদবি দিয়ে খুঁজুন"
            aria-label="কর্মকর্তা খুঁজুন"
            className={cn(controlClass, "pl-9")}
          />
        </div>
        <select aria-label="দপ্তর" value={dept} onChange={(e) => setDept(e.target.value)} className={controlClass}>
          <option value="">সব দপ্তর</option>
          {db.settings.departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {!hydrated ? (
          <div className="flex flex-col gap-3 p-4" role="status" aria-label="লোড হচ্ছে">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState title="কোনো কর্মকর্তা পাওয়া যায়নি" hint="সার্চ শব্দ বা দপ্তর ফিল্টার পরিবর্তন করুন, অথবা নতুন কর্মকর্তা যুক্ত করুন।" />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-body">
                <caption className="sr-only">কর্মকর্তাদের তালিকা</caption>
                <thead>
                  <tr className="bg-canvas">
                    {["কর্মকর্তা", "দপ্তর", "যোগাযোগ", "চলমান", "সমাধান", "অবস্থা", "অ্যাকশন"].map((h) => (
                      <th key={h} scope="col" className="px-4 py-3.5 text-left text-caption font-semibold text-muted">
                        {h}
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
                        <div className="text-ink">{fmtPhone(o.phone)}</div>
                        <div className="text-caption text-muted">{o.email || "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{toBn(openLoad(db, o.id))}</td>
                      <td className="px-4 py-3 text-ink">{toBn(stats.get(o.id) ?? 0)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={o.active}
                          aria-label={`${o.name} — ${o.active ? "সক্রিয়" : "নিষ্ক্রিয়"}`}
                          onClick={() => toggle(o)}
                          className="group flex min-h-11 items-center gap-2 text-small font-semibold"
                        >
                          <span className={cn("relative h-6 w-10 rounded-full transition-colors duration-150", o.active ? "bg-primary" : "bg-line-strong")}>
                            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-all duration-150", o.active ? "left-[18px]" : "left-0.5")} />
                          </span>
                          <span className={o.active ? "text-primary" : "text-muted"}>{o.active ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setModal({ officer: o })} aria-label={`${o.name} সম্পাদনা`} className="flex size-11 items-center justify-center rounded-control text-muted hover:bg-canvas hover:text-primary">
                            <Pencil size={17} />
                          </button>
                          <button type="button" onClick={() => setConfirm(o)} aria-label={`${o.name} মুছুন`} className="flex size-11 items-center justify-center rounded-control text-muted hover:bg-st-rejected-bg hover:text-st-rejected">
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
                      {o.active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </div>
                  <p className="mt-2 text-small text-ink-2">
                    {fmtPhone(o.phone)} · চলমান {toBn(openLoad(db, o.id))} · সমাধান {toBn(stats.get(o.id) ?? 0)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="outline" className="px-3 py-1.5 text-small" onClick={() => setModal({ officer: o })}>
                      সম্পাদনা
                    </Button>
                    <Button variant="ghost" className="px-3 py-1.5 text-small" onClick={() => toggle(o)}>
                      {o.active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5 text-small" onClick={() => setConfirm(o)}>
                      মুছুন
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.officer ? "কর্মকর্তার তথ্য সম্পাদনা" : "নতুন কর্মকর্তা যুক্ত করুন"}>
        {modal && (
          <OfficerForm
            key={modal.officer?.id ?? "new"}
            editingId={modal.officer?.id}
            initialValue={modal.officer ? { ...modal.officer } : EMPTY}
            onDone={() => setModal(null)}
          />
        )}
      </Modal>

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title="কর্মকর্তাকে মুছে ফেলবেন?">
        <p className="text-body text-ink-2">
          <strong>{confirm?.name}</strong>-কে তালিকা থেকে স্থায়ীভাবে মুছে ফেলা হবে। যার নামে অভিযোগ যুক্ত আছে তাকে মুছা যায় না — সেক্ষেত্রে “নিষ্ক্রিয়” করুন।
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            বাতিল
          </Button>
          <Button variant="danger" onClick={doRemove}>
            মুছে ফেলুন
          </Button>
        </div>
      </Modal>
    </>
  );
}
