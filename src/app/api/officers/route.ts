import { NextResponse, type NextRequest } from "next/server";
import { ApiError, withApiErrors } from "@/lib/server/errors";
import { requireAdmin } from "@/lib/session";
import { listOfficers, saveOfficer, type OfficerInput } from "@/lib/server/officers";

export async function GET(req: NextRequest) {
  return withApiErrors(async () => {
    await requireAdmin(req);
    return NextResponse.json(await listOfficers());
  });
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function parseOfficerInput(body: unknown): OfficerInput {
  const o = (body ?? {}) as Record<string, unknown>;
  const name = str(o.name).trim();
  const designation = str(o.designation).trim();
  const department = str(o.department).trim();
  const phone = str(o.phone).trim();
  const email = str(o.email).trim();
  const active = Boolean(o.active);
  if (name.length < 2) throw new ApiError(400, "কর্মকর্তার নাম লিখুন");
  if (!designation) throw new ApiError(400, "পদবি লিখুন");
  if (!department) throw new ApiError(400, "দপ্তর নির্বাচন করুন");
  if (!/^01[3-9]\d{8}$/.test(phone)) throw new ApiError(400, "সঠিক মোবাইল নম্বর দিন");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "ইমেইল ঠিকানা সঠিক নয়");
  return { name, designation, department, phone, email, active };
}

export async function POST(req: NextRequest) {
  return withApiErrors(async () => {
    await requireAdmin(req);
    const body = await req.json().catch(() => null);
    const officer = await saveOfficer(parseOfficerInput(body));
    return NextResponse.json(officer, { status: 201 });
  });
}
