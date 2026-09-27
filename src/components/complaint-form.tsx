"use client";

import { Check, Copy, FileText, Paperclip, X } from "lucide-react";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { normalizePhone } from "@/lib/bn";
import { ACCEPTED_UPLOADS, MAX_ATTACHMENTS, MAX_UPLOAD_BYTES, PRIORITIES, PRIORITY_META } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { fileToAttachment, fmtBytes } from "@/lib/image";
import { CATEGORY_DEPARTMENT } from "@/lib/seed";
import { createComplaint, useDb } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { Attachment, Complaint, Priority } from "@/lib/types";

type Errors = Partial<Record<string, string>>;

interface Props {
  mode: "public" | "admin";
  /** name shown in the history trail for admin-created complaints */
  actor?: string;
  onCreated?: (c: Complaint) => void;
}

export function ComplaintForm({ mode, actor, onCreated }: Props) {
  const { settings } = useDb();
  const toast = useToast();
  const { t, tt, n, phone: fmtPhoneL } = useT();
  const formRef = useRef<HTMLFormElement>(null);

  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setDepartment("");
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("medium");
    setFiles([]);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setConfirmed(false);
    setAttempted(false);
    setFileError("");
    setDone(null);
    setCopied(false);
  };

  const onCategory = (value: string) => {
    setCategory(value);
    const suggested = CATEGORY_DEPARTMENT[value];
    if (!department && suggested && settings.departments.includes(suggested)) setDepartment(suggested);
  };

  const addFiles = async (list: FileList | File[]) => {
    setFileError("");
    const incoming = Array.from(list);
    const room = MAX_ATTACHMENTS - files.length;
    if (room <= 0) {
      setFileError(tt("maxFilesAllowed", { n: n(MAX_ATTACHMENTS) }));
      return;
    }
    const accepted: File[] = [];
    for (const f of incoming.slice(0, room)) {
      if (!ACCEPTED_UPLOADS.includes(f.type)) {
        setFileError(tt("onlyJpgPngPdf", { name: f.name }));
        continue;
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        setFileError(tt("fileTooLarge", { name: f.name }));
        continue;
      }
      accepted.push(f);
    }
    if (incoming.length > room) setFileError(tt("maxFilesAllowed", { n: n(MAX_ATTACHMENTS) }));
    const converted = await Promise.all(accepted.map(fileToAttachment));
    setFiles((s) => [...s, ...converted]);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void addFiles(e.dataTransfer.files);
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!department) e.department = "দপ্তর নির্বাচন করুন";
    if (!category) e.category = "অভিযোগের ধরন নির্বাচন করুন";
    if (subject.trim().length < 5) e.subject = "বিষয় অন্তত ৫ অক্ষরে লিখুন";
    if (description.trim().length < 20) e.description = "বিবরণ অন্তত ২০ অক্ষরে লিখুন";
    if (name.trim().length < 2) e.name = "আপনার পূর্ণ নাম লিখুন";
    if (!normalizePhone(phone)) e.phone = "সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২-৩৪৫৬৭৮)";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "ইমেইল ঠিকানা সঠিক নয়";
    if (address.trim().length < 5) e.address = "ঠিকানা লিখুন";
    if (mode === "public" && !confirmed) e.confirmed = "তথ্যের সত্যতা নিশ্চিত করুন";
    return e;
  };

  // After the first submit attempt, errors update live as the user fixes each field.
  const errors: Errors = attempted ? validate() : {};

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    setAttempted(true);
    if (Object.keys(validate()).length) {
      // wait for the aria-invalid attributes to render, then focus the first bad field
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setBusy(true);
    try {
      const created = await createComplaint({
        subject,
        category,
        department,
        description,
        citizen: { name, phone: normalizePhone(phone)!, email, address },
        attachments: files,
        priority: mode === "admin" ? priority : undefined,
        source: mode === "admin" ? "admin" : "online",
        by: actor ?? "নাগরিক",
      });
      if (mode === "admin") {
        toast(tt("complaintAddedToast", { id: created.id }));
        onCreated?.(created);
      } else {
        setDone(created);
        onCreated?.(created);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      toast(t(err instanceof Error ? err.message : "জমা দেওয়া যায়নি, আবার চেষ্টা করুন"), "error");
    } finally {
      setBusy(false);
    }
  };

  const copyId = async () => {
    if (!done) return;
    try {
      await navigator.clipboard.writeText(done.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(t("কপি করা যায়নি — আইডিটি হাতে লিখে রাখুন"), "error");
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center rounded-panel border border-line bg-surface px-6 py-10 text-center sm:px-10 sm:py-12">
        <div className="mb-[18px] flex size-[60px] items-center justify-center rounded-full bg-st-resolved-bg">
          <Check size={28} strokeWidth={2.5} className="text-st-resolved" />
        </div>
        <h2 className="text-brand font-bold text-ink" role="status">
          {t("আপনার অভিযোগ সফলভাবে জমা হয়েছে")}
        </h2>
        <p className="mt-2 max-w-[380px] text-small leading-relaxed text-muted">
          {tt("submittedHint", { phone: fmtPhoneL(done.citizen.phone) })}
        </p>
        <div className="mt-[22px] rounded-[10px] border border-dashed border-line-strong bg-canvas px-7 py-3.5">
          <div className="text-[11px] text-muted">{t("ট্র্যাকিং আইডি")}</div>
          <div className="text-h2 font-bold tracking-wide text-primary">{done.id}</div>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={copyId}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? t("কপি হয়েছে") : t("আইডি কপি করুন")}
          </Button>
          <LinkButton href={`/track?id=${done.id}`}>{t("অগ্রগতি দেখুন")}</LinkButton>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-5 min-h-11 px-3 text-small font-semibold text-primary hover:text-primary-hover"
        >
          {t("নতুন অভিযোগ জমা দিন")}
        </button>
      </div>
    );
  }

  const err = (k: string) => {
    const e = errors[k];
    return e ? t(e) : undefined;
  };
  const aria = (k: string) => ({
    "aria-invalid": err(k) ? (true as const) : undefined,
    "aria-describedby": err(k) ? `${k}-error` : undefined,
  });

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className={cn(
        "flex flex-col gap-5 bg-surface",
        mode === "public" ? "rounded-panel border border-line p-5 sm:p-9" : "rounded-card border border-line p-5 sm:p-8",
      )}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("সংশ্লিষ্ট দপ্তর")} htmlFor="department" required error={err("department")}>
          <Select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} {...aria("department")}>
            <option value="">{t("নির্বাচন করুন")}</option>
            {settings.departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("অভিযোগের ধরন")} htmlFor="category" required error={err("category")}>
          <Select id="category" value={category} onChange={(e) => onCategory(e.target.value)} {...aria("category")}>
            <option value="">{t("নির্বাচন করুন")}</option>
            {settings.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t("বিষয় (সংক্ষেপে)")} htmlFor="subject" required error={err("subject")}>
        <Input
          id="subject"
          value={subject}
          maxLength={120}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("যেমন: সড়কে বড় গর্ত, দুর্ঘটনার আশঙ্কা")}
          {...aria("subject")}
        />
      </Field>

      <Field
        label={t("বিস্তারিত বিবরণ")}
        htmlFor="description"
        required
        error={err("description")}
        hint={tt("charCountHint", { n: n(description.trim().length) })}
      >
        <Textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("আপনার অভিযোগের বিস্তারিত লিখুন...")}
          {...aria("description")}
        />
      </Field>

      {mode === "admin" && (
        <Field label={t("অগ্রাধিকার")} htmlFor="priority">
          <Select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(PRIORITY_META[p].label)}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-small font-semibold text-ink">{t("সংযুক্তি (ঐচ্ছিক)")}</span>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center rounded-control border-[1.5px] border-dashed p-5 text-center text-small text-muted transition-colors duration-150 focus-within:outline-2 focus-within:outline-primary",
            dragging ? "border-primary bg-primary-tint" : "border-line-strong hover:border-primary",
          )}
        >
          <Paperclip size={20} aria-hidden className="mb-1.5" />
          {t("ফাইল বাছাই করুন বা এখানে টেনে আনুন")}
          <span className="mt-1 text-caption text-faint">{tt("uploadHint", { n: n(MAX_ATTACHMENTS) })}</span>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {fileError && (
          <p role="alert" className="text-caption font-medium text-st-rejected">
            {fileError}
          </p>
        )}
        {files.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex max-w-full items-center gap-2 rounded-control border border-line bg-canvas py-1.5 pl-2 pr-1 text-small"
              >
                {f.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.dataUrl} alt="" className="size-8 rounded object-cover" />
                ) : (
                  <FileText size={18} aria-hidden className="text-muted" />
                )}
                <span className="truncate">{f.name}</span>
                <span className="text-caption text-muted">{n(fmtBytes(f.size))}</span>
                <button
                  type="button"
                  aria-label={tt("removeFile", { name: f.name })}
                  onClick={() => setFiles((s) => s.filter((_, j) => j !== i))}
                  className="flex size-8 items-center justify-center rounded text-muted hover:bg-line hover:text-ink"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="my-1 h-px bg-line" />
      <h2 className="text-body font-bold text-ink">{mode === "admin" ? t("অভিযোগকারীর তথ্য") : t("আপনার তথ্য")}</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("পূর্ণ নাম")} htmlFor="name" required error={err("name")}>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("আপনার নাম লিখুন")} {...aria("name")} />
        </Field>
        <Field label={t("মোবাইল নম্বর")} htmlFor="phone" required error={err("phone")}>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("০১XXX-XXXXXX")}
            {...aria("phone")}
          />
        </Field>
      </div>

      <Field label={t("ইমেইল (ঐচ্ছিক)")} htmlFor="email" error={err("email")}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          {...aria("email")}
        />
      </Field>

      <Field label={t("ঠিকানা")} htmlFor="address" required error={err("address")}>
        <Textarea
          id="address"
          rows={2}
          autoComplete="street-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("বাসা/হোল্ডিং নম্বর, রোড, এলাকা, জেলা")}
          {...aria("address")}
        />
      </Field>

      {mode === "public" && (
        <div>
          <label className="flex min-h-11 items-start gap-2.5 text-caption leading-normal text-muted">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-primary"
              aria-invalid={err("confirmed") ? true : undefined}
              aria-describedby={err("confirmed") ? "confirmed-error" : undefined}
            />
            {t("আমি নিশ্চিত করছি যে উপরের তথ্যগুলো সঠিক ও সত্য")}
          </label>
          {err("confirmed") && (
            <p id="confirmed-error" role="alert" className="text-caption font-medium text-st-rejected">
              {err("confirmed")}
            </p>
          )}
        </div>
      )}

      <Button type="submit" disabled={busy} className="py-3.5 text-lead font-bold">
        {mode === "admin" ? t("অভিযোগ যুক্ত করুন") : t("অভিযোগ জমা দিন")}
      </Button>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-center text-small font-medium text-st-rejected">
          {tt("fixFieldsCount", { n: n(Object.keys(errors).length) })}
        </p>
      )}
    </form>
  );
}
