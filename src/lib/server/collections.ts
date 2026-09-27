import "server-only";
import type { Collection } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import type { Complaint, Officer, Settings } from "@/lib/types";

/** Mongo documents use the app's own string ids (e.g. "BD-2026-0117", "off-1") as `_id` — no separate ObjectId needed. */
export type ComplaintDoc = Complaint & { _id: string };
export type OfficerDoc = Officer & { _id: string };
export type SettingsDoc = Settings & { _id: "app" };
export interface CounterDoc {
  _id: string; // year, e.g. "2026"
  seq: number;
}

let indexesEnsured: Promise<void> | null = null;

async function ensureIndexes() {
  const db = await getMongoDb();
  await Promise.all([
    db.collection<ComplaintDoc>("complaints").createIndexes([
      { key: { status: 1 } },
      { key: { category: 1 } },
      { key: { priority: 1 } },
      { key: { createdAt: -1 } },
      { key: { "citizen.phone": 1 } },
      { key: { officerId: 1 } },
    ]),
    db.collection<OfficerDoc>("officers").createIndex({ department: 1 }),
  ]);
}

async function collections() {
  const db = await getMongoDb();
  if (!indexesEnsured) indexesEnsured = ensureIndexes();
  await indexesEnsured;
  return {
    complaints: db.collection<ComplaintDoc>("complaints"),
    officers: db.collection<OfficerDoc>("officers"),
    settings: db.collection<SettingsDoc>("settings"),
    counters: db.collection<CounterDoc>("counters"),
  };
}

export async function complaintsCol(): Promise<Collection<ComplaintDoc>> {
  return (await collections()).complaints;
}
export async function officersCol(): Promise<Collection<OfficerDoc>> {
  return (await collections()).officers;
}
export async function settingsCol(): Promise<Collection<SettingsDoc>> {
  return (await collections()).settings;
}
export async function countersCol(): Promise<Collection<CounterDoc>> {
  return (await collections()).counters;
}

/** Strips Mongo's `_id` before sending a document to the client (the app's own `id`/`_id` string is kept as `id`). */
export function withoutMongoId<T extends { _id: unknown }>(doc: T): Omit<T, "_id"> {
  const rest: Partial<T> = { ...doc };
  delete rest._id;
  return rest as Omit<T, "_id">;
}
