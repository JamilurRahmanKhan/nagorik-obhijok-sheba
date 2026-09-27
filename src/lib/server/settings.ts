import "server-only";
import { ensureSeeded, insertSeedData } from "./seed";
import { DEFAULT_SETTINGS, buildSeed } from "@/lib/seed";
import { settingsCol, complaintsCol, officersCol, countersCol, withoutMongoId } from "./collections";
import type { Settings } from "@/lib/types";

export async function getSettings(): Promise<Settings> {
  await ensureSeeded();
  const col = await settingsCol();
  const doc = await col.findOne({ _id: "app" });
  return doc ? withoutMongoId(doc) : DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  await ensureSeeded();
  const col = await settingsCol();
  const current = (await col.findOne({ _id: "app" })) ?? { ...DEFAULT_SETTINGS, _id: "app" as const };
  const next: Settings = { ...withoutMongoId(current), ...patch };
  await col.updateOne({ _id: "app" }, { $set: { ...next, _id: "app" } }, { upsert: true });
  return next;
}

/** Drops all app collections and reseeds from the same generator used on first boot. */
export async function resetDemoData(): Promise<void> {
  const [complaints, officers, counters] = await Promise.all([complaintsCol(), officersCol(), countersCol()]);
  await Promise.all([complaints.deleteMany({}), officers.deleteMany({}), counters.deleteMany({})]);
  await insertSeedData(buildSeed());
}
