import "server-only";
import { buildSeed, DB_VERSION } from "@/lib/seed";
import type { DbState } from "@/lib/types";
import { complaintsCol, countersCol, officersCol, settingsCol } from "./collections";

/** Inserts a full seed/reset dataset into (already-emptied, for reset) or empty (for first boot) collections. */
export async function insertSeedData(data: DbState) {
  const [complaints, officers, settings, counters] = await Promise.all([
    complaintsCol(),
    officersCol(),
    settingsCol(),
    countersCol(),
  ]);

  const maxByYear = new Map<string, number>();
  for (const c of data.complaints) {
    const m = /^BD-(\d{4})-(\d+)$/.exec(c.id);
    if (!m) continue;
    maxByYear.set(m[1], Math.max(maxByYear.get(m[1]) ?? 0, Number(m[2])));
  }

  await Promise.all([
    data.complaints.length
      ? complaints.insertMany(data.complaints.map((c) => ({ ...c, _id: c.id })))
      : Promise.resolve(undefined),
    data.officers.length
      ? officers.insertMany(data.officers.map((o) => ({ ...o, _id: o.id })))
      : Promise.resolve(undefined),
    settings.updateOne({ _id: "app" }, { $set: { ...data.settings, _id: "app" } }, { upsert: true }),
    ...[...maxByYear.entries()].map(([year, seq]) =>
      counters.updateOne({ _id: year }, { $max: { seq } }, { upsert: true }),
    ),
  ]);
}

/** Runs once per server process (cached in-memory) and once more per empty database. */
let seeded: Promise<void> | null = null;

async function seedIfEmpty() {
  const complaints = await complaintsCol();
  if ((await complaints.countDocuments()) > 0) return;
  await insertSeedData(buildSeed());
}

/** Call at the start of every data-layer entry point. Cheap after the first call. */
export function ensureSeeded(): Promise<void> {
  if (!seeded) seeded = seedIfEmpty();
  return seeded;
}

export { DB_VERSION };
