"use client";

import { ArrowLeft, FileText, MessageSquare, NotebookPen, Send, Workflow } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { PriorityBadge, Pill, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/fields";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Timeline } from "@/components/timeline";
import { fmtDateLong, fmtDateTime, fmtPhone, toBn } from "@/lib/bn";
import { ALL_STATUSES, PRIORITIES, PRIORITY_META, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { fmtBytes } from "@/lib/image";
import { slaInfo } from "@/lib/metrics";
import { applyComplaintUpdate, fillTemplate, findComplaint, officerLabel, sendSms, useDb, type Db } from "@/lib/store";
import type { Complaint, Priority, Status } from "@/lib/types";

/* ---------------- activity feed ---------------- */

interface FeedItem {
  key: string;
  at: string;
  kind: "status" | "note" | "sms";
  title: string;
  body?: string;
  by: string;
}

function buildFeed(c: Complaint): FeedItem[] {
  const items: FeedItem[] = [
    ...c.history.map((h, i) => ({
      key: `h${i}`,
      at: h.at,
      kind: "status" as const,
      title: h.status === "new" ? "অভিযোগ জমা হয়েছে" : `স্ট্যাটাস: ${STATUS_META[h.status].label}`,
      body: h.note,
      by: h.by,
    })),
    ...c.notes.map((n) => ({
      key: n.id,
      at: n.at,
      kind: n.kind,
      title: n.kind === "sms" ? "SMS পাঠানো হয়েছে" : "অভ্যন্তরীণ নোট",
      body: n.text,
      by: n.by,
    })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

const FEED_ICON = { status: Workflow, note: NotebookPen, sms: MessageSquare } as const;

/* ---------------- SMS modal ---------------- */

function SmsModal({ complaint, db, open, onClose }: { complaint: Complaint; db: Db; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const officer = db.officers.find((o) => o.id === complaint.officerId);
  const tplVars = { id: complaint.id, officer: officer ? officerLabel(officer) : "সংশ্লিষ্ট কর্মকর্তা" };
  const templates = [
    { key: "received", label: "অভিযোগ গৃহীত", text: fillTemplate(db.settings.smsTemplates.received, tplVars) },
    { key: "assigned", label: "কর্মকর্তা নির্ধারিত", text: fillTemplate(db.settings.smsTemplates.assigned, tplVars) },
    { key: "resolved", label: "সমাধান সম্পন্ন", text: fillTemplate(db.settings.smsTemplates.resolved, tplVars) },
    { key: "custom", label: "নিজে লিখুন", text: "" },
  ];
  const [tpl, setTpl] = useState("received");
  const [text, setText] = useState(templates[0].text);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const segments = Math.max(1, Math.ceil(text.length / 70)); // Unicode SMS = 70 chars/segment

  const send = async () => {
    if (text.trim().length < 5) {
      setError("বার্তা অন্তত ৫ অক্ষরের হতে হবে");
      return;
    }
    setBusy(true);
    try {
      await sendSms(complaint.id, text);
      toast(`${fmtPhone(complaint.citizen.phone)} নম্বরে SMS পাঠানো হয়েছে (ডেমো)`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "পাঠানো যায়নি");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="SMS পাঠান">
      <div className="flex flex-col gap-4">
        <p className="rounded-control bg-canvas px-3 py-2 text-small text-muted">
          প্রাপক: <strong className="text-ink">{complaint.citizen.name}</strong> · {fmtPhone(complaint.citizen.phone)}
        </p>
        <Field label="টেমপ্লেট" htmlFor="sms-tpl">
          <Select
            id="sms-tpl"
            value={tpl}
            onChange={(e) => {
              setTpl(e.target.value);
              setText(templates.find((t) => t.key === e.target.value)?.text ?? "");
              setError("");
            }}
          >
            {templates.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="বার্তা"
          htmlFor="sms-text"
          error={error}
          hint={`${toBn(text.length)} অক্ষর · প্রায় ${toBn(segments)}টি SMS`}
        >
          <Textarea id="sms-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-invalid={error ? true : undefined} />
        </Field>
        <p className="text-caption text-muted">ডেমো মোড: বাস্তব SMS গেটওয়ে সংযুক্ত নেই। বার্তাটি কেবল অভিযোগের কার্যবিবরণীতে সংরক্ষিত হবে।</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            বাতিল
          </Button>
          <Button onClick={send} disabled={busy}>
            <Send size={16} /> পাঠান
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- action panel ---------------- */

function ActionPanel({ complaint, db }: { complaint: Complaint; db: Db }) {
  const toast = useToast();
  const [officerId, setOfficerId] = useState(complaint.officerId ?? "");
  const [status, setStatus] = useState<Status>(complaint.status);
  const [priority, setPrio] = useState<Priority>(complaint.priority);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);

  const publicNote = status === "resolved" || status === "rejected";

  const officers = useMemo(() => {
    const active = db.officers.filter((o) => o.active);
    // same-department officers first
    return [...active].sort(
      (a, b) => Number(b.department === complaint.department) - Number(a.department === complaint.department) || a.name.localeCompare(b.name, "bn"),
    );
  }, [db.officers, complaint.department]);

  // The server applies officer assignment, priority and status/note together in one
  // atomic update (see applyComplaintUpdate in src/lib/server/complaints.ts), so the
  // client just sends whatever changed and reports whatever error comes back.
  const apply = async () => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await applyComplaintUpdate(complaint.id, {
        officerId: officerId && officerId !== complaint.officerId ? officerId : undefined,
        priority: priority !== complaint.priority ? priority : undefined,
        status: status !== complaint.status ? status : undefined,
        note: note.trim() || undefined,
      });
      setNote("");
      toast("অভিযোগ হালনাগাদ হয়েছে");
    } catch (err) {
      setError(err instanceof Error ? err.message : "হালনাগাদ করা যায়নি");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <Field label="কর্মকর্তা নির্ধারণ করুন" htmlFor="officer">
        <Select id="officer" value={officerId} onChange={(e) => setOfficerId(e.target.value)}>
          <option value="">নির্বাচন করুন</option>
          {officers.map((o) => (
            <option key={o.id} value={o.id}>
              {officerLabel(o)}
              {o.department !== complaint.department ? ` — ${o.department}` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label="স্ট্যাটাস" htmlFor="status">
          <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="অগ্রাধিকার" htmlFor="priority">
          <Select id="priority" value={priority} onChange={(e) => setPrio(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field
        label={publicNote ? "সিদ্ধান্তের বিবরণ" : "অভ্যন্তরীণ নোট"}
        htmlFor="note"
        hint={
          status === "rejected"
            ? "বাতিলের কারণ লেখা আবশ্যক — নাগরিক ট্র্যাকিং পেজে দেখতে পাবেন"
            : publicNote
              ? "সমাধানের সংক্ষিপ্ত বিবরণ — নাগরিক ট্র্যাকিং পেজে দেখতে পাবেন"
              : "কেবল কর্মকর্তারা দেখতে পাবেন"
        }
      >
        <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="নোট লিখুন..." />
      </Field>
      {error && (
        <p role="alert" className="rounded-control bg-st-rejected-bg px-3 py-2 text-small font-medium text-st-rejected">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button className="flex-1 px-3 py-3 text-small" onClick={apply} disabled={busy}>
          স্ট্যাটাস আপডেট করুন
        </Button>
        <Button variant="outline" className="flex-1 px-3 py-3 text-small" onClick={() => setSmsOpen(true)}>
          SMS পাঠান
        </Button>
      </div>
      <SmsModal complaint={complaint} db={db} open={smsOpen} onClose={() => setSmsOpen(false)} />
    </Card>
  );
}

/* ---------------- page ---------------- */

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const hydrated = !db.loading;
  const complaint = hydrated ? findComplaint(db, decodeURIComponent(id)) : undefined;
  const feed = useMemo(() => (complaint ? buildFeed(complaint) : []), [complaint]);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="লোড হচ্ছে">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="rounded-card border border-line bg-surface">
        <EmptyState
          title="অভিযোগটি খুঁজে পাওয়া যায়নি"
          hint={`"${decodeURIComponent(id)}" আইডির কোনো অভিযোগ নেই।`}
          action={
            <Link href="/admin/complaints" className="font-semibold">
              ← সকল অভিযোগে ফিরে যান
            </Link>
          }
        />
      </div>
    );
  }

  const officer = db.officers.find((o) => o.id === complaint.officerId);
  const sla = slaInfo(complaint, db.settings);
  const slaText = {
    "open-ok": `নির্ধারিত সময়ের মধ্যে — ${toBn(sla.days)} দিন বাকি`,
    "open-late": `সময়সীমা ${toBn(sla.days)} দিন অতিক্রান্ত`,
    "done-ok": `${toBn(sla.days)} দিনে সমাধান — নির্ধারিত সময়ের মধ্যে`,
    "done-late": `${toBn(sla.days)} দিনে সমাধান — নির্ধারিত সময়ের পরে`,
    closed: "বাতিলকৃত অভিযোগ",
  }[sla.kind];

  const rows: [string, string][] = [
    ["নাম", complaint.citizen.name],
    ["মোবাইল", fmtPhone(complaint.citizen.phone)],
    ["ইমেইল", complaint.citizen.email ?? "—"],
    ["ঠিকানা", complaint.citizen.address],
  ];

  return (
    <>
      <PageHeader title="অভিযোগের বিস্তারিত" />

      <Link href="/admin/complaints" className="-mt-3 inline-flex min-h-11 items-center gap-1.5 text-small font-semibold">
        <ArrowLeft size={16} aria-hidden /> সকল অভিযোগে ফিরে যান
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="mb-1.5 text-small font-semibold text-muted">{complaint.id}</div>
          <h2 className="max-w-[620px] text-h2 font-bold leading-snug text-ink">{complaint.subject}</h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <Pill>{complaint.category}</Pill>
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>
        <div className="sm:text-right">
          <div className="text-caption text-muted">জমার তারিখ</div>
          <div className="text-body font-semibold text-ink">{fmtDateLong(complaint.createdAt)}</div>
          <div
            className={cn(
              "mt-1 text-caption font-medium",
              sla.kind === "open-late" || sla.kind === "done-late" ? "text-st-rejected" : "text-muted",
            )}
          >
            {slaText}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          <Card>
            <CardTitle className="mb-2.5">বিবরণ</CardTitle>
            <p className="whitespace-pre-line text-body leading-[1.8] text-ink-2">{complaint.description}</p>
            <p className="mt-3 text-caption text-muted">
              সংশ্লিষ্ট দপ্তর: <span className="font-medium text-ink-2">{complaint.department}</span>
              {complaint.source === "admin" && " · অ্যাডমিন কর্তৃক যুক্ত"}
            </p>
          </Card>

          <Card>
            <CardTitle>অভিযোগকারীর তথ্য</CardTitle>
            <dl className="grid gap-4 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="mb-0.5 text-caption text-muted">{k}</dt>
                  <dd className="break-words text-body font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardTitle>সংযুক্তি</CardTitle>
            {complaint.attachments.length === 0 ? (
              <p className="text-body text-muted">কোনো সংযুক্তি নেই।</p>
            ) : (
              <ul className="flex flex-wrap gap-3">
                {complaint.attachments.map((a, i) => (
                  <li key={`${a.name}-${i}`}>
                    {a.dataUrl ? (
                      <a href={a.dataUrl} target="_blank" rel="noreferrer" className="block" aria-label={`${a.name} বড় করে দেখুন`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.dataUrl} alt={a.name} className="h-[120px] w-40 rounded-control border border-line object-cover" />
                      </a>
                    ) : (
                      <div className="flex h-[120px] w-40 flex-col items-center justify-center gap-1.5 rounded-control border border-dashed border-line-strong bg-canvas px-2 text-center text-caption text-muted">
                        <FileText size={20} aria-hidden />
                        <span className="line-clamp-2">{a.name}</span>
                        {a.size > 0 && <span>{toBn(fmtBytes(a.size))}</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>কার্যবিবরণী</CardTitle>
            <ol className="flex flex-col">
              {feed.map((f) => {
                const Icon = FEED_ICON[f.kind];
                return (
                  <li key={f.key} className="flex gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas text-muted">
                      <Icon size={15} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-small font-semibold text-ink">{f.title}</p>
                      {f.body && <p className="mt-0.5 whitespace-pre-line break-words text-body text-ink-2">{f.body}</p>}
                      <p className="mt-0.5 text-caption text-muted">
                        {f.by} · {fmtDateTime(f.at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardTitle className="mb-4">অগ্রগতির অবস্থা</CardTitle>
            <Timeline complaint={complaint} />
            <p className="mt-4 border-t border-line pt-3 text-small text-muted">
              দায়িত্বপ্রাপ্ত কর্মকর্তা: <span className="font-semibold text-ink">{officerLabel(officer)}</span>
            </p>
          </Card>
          <ActionPanel
            key={`${complaint.status}-${complaint.officerId}-${complaint.priority}`}
            complaint={complaint}
            db={db}
          />
        </div>
      </div>
    </>
  );
}
