import "server-only";
import { ensureSeeded } from "./seed";
import { ApiError } from "./errors";
import { complaintsCol, officersCol, withoutMongoId, type ComplaintDoc } from "./collections";
import { getSettings } from "./settings";
import { nextComplaintId } from "./counters";
import { officerLabel, fillTemplate } from "@/lib/format";
import type { ActivityNote, Attachment, Citizen, Complaint, Officer, Priority, Status } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 10);
const nowIso = () => new Date().toISOString();

export async function listComplaints(): Promise<Complaint[]> {
  await ensureSeeded();
  const col = await complaintsCol();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(withoutMongoId);
}

export type PublicComplaint = Complaint & { officerLabel: string | null };

/**
 * Public tracking lookup — only returns the complaint when the phone number matches, and
 * never reveals *why* it didn't (so a stranger can't use this to confirm an id exists).
 * Includes the assigned officer's display name/designation only — never their phone/email.
 */
export async function findForTracking(id: string, phone: string): Promise<PublicComplaint | null> {
  await ensureSeeded();
  const col = await complaintsCol();
  const escaped = id.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const doc = await col.findOne({ _id: new RegExp(`^${escaped}$`, "i") });
  if (!doc || doc.citizen.phone !== phone) return null;
  const officer = await findOfficerById(doc.officerId);
  return { ...withoutMongoId(doc), officerLabel: officer ? officerLabel(officer) : null };
}

function smsNote(text: string, by: string, auto: boolean): ActivityNote {
  return { id: uid(), kind: "sms", text: auto ? `[স্বয়ংক্রিয়] ${text}` : text, by, at: nowIso() };
}

export interface NewComplaintInput {
  subject: string;
  category: string;
  department: string;
  description: string;
  citizen: Citizen;
  attachments: Attachment[];
  priority?: Priority;
  source: "online" | "admin";
  by: string;
}

export async function createComplaint(input: NewComplaintInput): Promise<Complaint> {
  await ensureSeeded();
  const settings = await getSettings();
  const id = await nextComplaintId();
  const now = nowIso();
  const complaint: Complaint = {
    id,
    subject: input.subject.trim(),
    category: input.category,
    department: input.department,
    description: input.description.trim(),
    priority: input.priority ?? "medium",
    status: "new",
    citizen: {
      ...input.citizen,
      name: input.citizen.name.trim(),
      address: input.citizen.address.trim(),
      email: input.citizen.email?.trim() || undefined,
    },
    attachments: input.attachments,
    createdAt: now,
    updatedAt: now,
    history: [{ status: "new", at: now, by: input.source === "admin" ? input.by : "নাগরিক" }],
    notes: settings.smsOnSubmit ? [smsNote(fillTemplate(settings.smsTemplates.received, { id }), "সিস্টেম", true)] : [],
    source: input.source,
  };
  const col = await complaintsCol();
  await col.insertOne({ ...complaint, _id: id });
  return complaint;
}

async function getDocOrThrow(id: string): Promise<ComplaintDoc> {
  const col = await complaintsCol();
  const doc = await col.findOne({ _id: id });
  if (!doc) throw new ApiError(404, "অভিযোগটি খুঁজে পাওয়া যায়নি");
  return doc;
}

async function saveDoc(doc: ComplaintDoc): Promise<Complaint> {
  const col = await complaintsCol();
  await col.replaceOne({ _id: doc._id }, doc);
  return withoutMongoId(doc);
}

async function findOfficerById(officerId: string | undefined): Promise<Officer | undefined> {
  if (!officerId) return undefined;
  const col = await officersCol();
  const doc = await col.findOne({ _id: officerId });
  return doc ? withoutMongoId(doc) : undefined;
}

/**
 * Applies the admin detail-page "apply" action: officer assignment, priority and/or
 * status/note, in that order — mirrors the old client-side ActionPanel logic exactly,
 * just as one server-side read-modify-write instead of several localStorage commits.
 */
export interface ApplyComplaintInput {
  officerId?: string;
  priority?: Priority;
  status?: Status;
  note?: string;
}

export async function applyComplaintUpdate(id: string, input: ApplyComplaintInput, by: string): Promise<Complaint> {
  await ensureSeeded();
  const settings = await getSettings();
  let doc = await getDocOrThrow(id);
  const at = nowIso();
  let changed = false;

  if (input.officerId && input.officerId !== doc.officerId) {
    const officer = await findOfficerById(input.officerId);
    if (!officer) throw new ApiError(404, "কর্মকর্তা খুঁজে পাওয়া যায়নি");
    if (!officer.active) throw new ApiError(409, "এই কর্মকর্তা বর্তমানে নিষ্ক্রিয়");
    const advance = doc.status === "new" || doc.status === "reviewing";
    const notes = [...doc.notes];
    if (advance && settings.smsOnStatusChange) {
      notes.push(
        smsNote(fillTemplate(settings.smsTemplates.assigned, { id: doc.id, officer: officerLabel(officer) }), "সিস্টেম", true),
      );
    }
    doc = {
      ...doc,
      officerId: input.officerId,
      updatedAt: at,
      status: advance ? "assigned" : doc.status,
      history: advance
        ? [...doc.history, { status: "assigned" as const, at, by, note: `${officerLabel(officer)}-কে নির্ধারণ করা হয়েছে` }]
        : doc.history,
      notes,
    };
    changed = true;
  }

  if (input.priority && input.priority !== doc.priority) {
    doc = { ...doc, priority: input.priority, updatedAt: at };
    changed = true;
  }

  if (input.status && input.status !== doc.status) {
    if (input.status === "rejected" && !input.note?.trim()) throw new ApiError(400, "বাতিলের কারণ লিখতে হবে");
    if ((input.status === "assigned" || input.status === "in_progress" || input.status === "resolved") && !doc.officerId) {
      throw new ApiError(400, "প্রথমে একজন কর্মকর্তা নির্ধারণ করুন");
    }
    const officer = await findOfficerById(doc.officerId);
    const notes = [...doc.notes];
    if (settings.smsOnStatusChange) {
      const tpl =
        input.status === "resolved"
          ? settings.smsTemplates.resolved
          : input.status === "assigned"
            ? settings.smsTemplates.assigned
            : null;
      if (tpl) notes.push(smsNote(fillTemplate(tpl, { id: doc.id, officer: officer ? officerLabel(officer) : "" }), "সিস্টেম", true));
    }
    doc = {
      ...doc,
      status: input.status,
      updatedAt: at,
      history: [...doc.history, { status: input.status, at, by, note: input.note?.trim() || undefined }],
      notes,
    };
    changed = true;
  } else if (input.note?.trim()) {
    doc = { ...doc, notes: [...doc.notes, { id: uid(), kind: "note" as const, text: input.note.trim(), by, at }] };
    changed = true;
  }

  if (!changed) throw new ApiError(400, "কোনো পরিবর্তন করা হয়নি");
  return saveDoc(doc);
}

export async function sendSms(id: string, text: string, by: string): Promise<Complaint> {
  await ensureSeeded();
  if (text.trim().length < 5) throw new ApiError(400, "বার্তা অন্তত ৫ অক্ষরের হতে হবে");
  const doc = await getDocOrThrow(id);
  return saveDoc({ ...doc, notes: [...doc.notes, smsNote(text.trim(), by, false)] });
}
