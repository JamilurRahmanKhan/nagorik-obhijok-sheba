import "server-only";
import { ensureSeeded } from "./seed";
import { ApiError } from "./errors";
import { complaintsCol, officersCol, withoutMongoId } from "./collections";
import type { Officer } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 10);

export async function listOfficers(): Promise<Officer[]> {
  await ensureSeeded();
  const col = await officersCol();
  const docs = await col.find({}).sort({ name: 1 }).toArray();
  return docs.map(withoutMongoId);
}

export type OfficerInput = Omit<Officer, "id">;

export async function saveOfficer(input: OfficerInput, id?: string): Promise<Officer> {
  await ensureSeeded();
  const col = await officersCol();
  const officerId = id ?? `off-${uid()}`;
  await col.updateOne({ _id: officerId }, { $set: { ...input, id: officerId } }, { upsert: true });
  return { ...input, id: officerId };
}

export async function removeOfficer(id: string): Promise<void> {
  await ensureSeeded();
  const complaints = await complaintsCol();
  const inUse = await complaints.countDocuments({ officerId: id });
  if (inUse > 0) {
    throw new ApiError(409, "এই কর্মকর্তার নামে অভিযোগ যুক্ত আছে — মুছে না ফেলে নিষ্ক্রিয় করুন");
  }
  const col = await officersCol();
  const result = await col.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw new ApiError(404, "কর্মকর্তা খুঁজে পাওয়া যায়নি");
}
