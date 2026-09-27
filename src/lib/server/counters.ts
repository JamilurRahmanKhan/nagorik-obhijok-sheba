import "server-only";
import { dhakaParts } from "@/lib/bn";
import { countersCol } from "./collections";

export async function nextComplaintId(now: Date = new Date()): Promise<string> {
  const year = dhakaParts(now).year;
  const counters = await countersCol();
  const doc = await counters.findOneAndUpdate(
    { _id: String(year) },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const seq = doc?.seq ?? 1;
  return `BD-${year}-${String(seq).padStart(4, "0")}`;
}
