"use client";

import useSWR, { mutate } from "swr";
import { DEFAULT_SETTINGS } from "./seed";
import { apiDelete, apiPatch, apiPost, fetcher } from "./api-client";
import type { Attachment, Citizen, Complaint, Officer, Priority, Settings, Status } from "./types";

/**
 * Client-side data layer, backed by the MongoDB-persisted API routes under `src/app/api/`
 * (see `src/lib/server/*` for the actual database logic). Reads go through SWR for caching
 * and revalidation; every write function below calls its endpoint and then revalidates the
 * affected SWR key(s), so all open components pick up the change.
 */

export { officerLabel, fillTemplate } from "./format";

const COMPLAINTS_KEY = "/api/complaints";
const OFFICERS_KEY = "/api/officers";
const SETTINGS_KEY = "/api/settings";

export interface Db {
  complaints: Complaint[];
  officers: Officer[];
  settings: Settings;
  /** true until the first successful load of all three resources. */
  loading: boolean;
}

/** Combines complaints + officers + settings, matching the shape the rest of the app expects. */
export function useDb(): Db {
  const { data: complaints, isLoading: l1 } = useSWR<Complaint[]>(COMPLAINTS_KEY, fetcher);
  const { data: officers, isLoading: l2 } = useSWR<Officer[]>(OFFICERS_KEY, fetcher);
  const { data: settings, isLoading: l3 } = useSWR<Settings>(SETTINGS_KEY, fetcher);
  return {
    complaints: complaints ?? [],
    officers: officers ?? [],
    settings: settings ?? DEFAULT_SETTINGS,
    loading: l1 || l2 || l3,
  };
}

export function findComplaint(db: Pick<Db, "complaints">, id: string): Complaint | undefined {
  const needle = id.trim().toLowerCase();
  return db.complaints.find((c) => c.id.toLowerCase() === needle);
}

export function openLoad(db: Pick<Db, "complaints">, officerId: string): number {
  return db.complaints.filter((c) => c.officerId === officerId && c.status !== "resolved" && c.status !== "rejected")
    .length;
}

/* ------------------------------------------------------------------ */
/* complaints                                                           */
/* ------------------------------------------------------------------ */

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
  const complaint = await apiPost<Complaint>(COMPLAINTS_KEY, input);
  await mutate(COMPLAINTS_KEY);
  return complaint;
}

/** Officer assignment, priority and/or status+note in one request — applied atomically server-side. */
export interface ApplyComplaintInput {
  officerId?: string;
  priority?: Priority;
  status?: Status;
  note?: string;
}

export async function applyComplaintUpdate(id: string, input: ApplyComplaintInput): Promise<Complaint> {
  const complaint = await apiPatch<Complaint>(`${COMPLAINTS_KEY}/${encodeURIComponent(id)}`, input);
  await mutate(COMPLAINTS_KEY);
  return complaint;
}

export async function sendSms(id: string, text: string): Promise<Complaint> {
  const complaint = await apiPost<Complaint>(`${COMPLAINTS_KEY}/${encodeURIComponent(id)}/sms`, { text });
  await mutate(COMPLAINTS_KEY);
  return complaint;
}

export type PublicComplaint = Complaint & { officerLabel: string | null };

/** Public tracking lookup — id + phone must both match. Resolves to null rather than distinguishing which part was wrong. */
export async function trackComplaint(id: string, phone: string): Promise<PublicComplaint | null> {
  const res = await fetch(`/api/track?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("খুঁজে পাওয়া যায়নি — পরে আবার চেষ্টা করুন");
  return res.json();
}

/* ------------------------------------------------------------------ */
/* officers                                                             */
/* ------------------------------------------------------------------ */

export type OfficerInput = Omit<Officer, "id">;

export async function saveOfficer(input: OfficerInput, id?: string): Promise<Officer> {
  const officer = id
    ? await apiPatch<Officer>(`${OFFICERS_KEY}/${encodeURIComponent(id)}`, input)
    : await apiPost<Officer>(OFFICERS_KEY, input);
  await mutate(OFFICERS_KEY);
  return officer;
}

export async function removeOfficer(id: string): Promise<void> {
  await apiDelete(`${OFFICERS_KEY}/${encodeURIComponent(id)}`);
  await mutate(OFFICERS_KEY);
}

/* ------------------------------------------------------------------ */
/* settings / maintenance                                               */
/* ------------------------------------------------------------------ */

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const settings = await apiPatch<Settings>(SETTINGS_KEY, patch);
  await mutate(SETTINGS_KEY);
  return settings;
}

export async function resetDemoData(): Promise<void> {
  await apiPost(`${SETTINGS_KEY}/reset`);
  await Promise.all([mutate(COMPLAINTS_KEY), mutate(OFFICERS_KEY), mutate(SETTINGS_KEY)]);
}
