import { NextResponse, type NextRequest } from "next/server";
import { ApiError, withApiErrors } from "@/lib/server/errors";
import { requireAdmin } from "@/lib/session";
import { removeOfficer, saveOfficer } from "@/lib/server/officers";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new ApiError(400, "অবৈধ অনুরোধ");
    const name = str(body.name).trim();
    const designation = str(body.designation).trim();
    const department = str(body.department).trim();
    const phone = str(body.phone).trim();
    const email = str(body.email).trim();
    const active = Boolean(body.active);
    if (name.length < 2) throw new ApiError(400, "কর্মকর্তার নাম লিখুন");
    if (!designation) throw new ApiError(400, "পদবি লিখুন");
    if (!department) throw new ApiError(400, "দপ্তর নির্বাচন করুন");
    if (!/^01[3-9]\d{8}$/.test(phone)) throw new ApiError(400, "সঠিক মোবাইল নম্বর দিন");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "ইমেইল ঠিকানা সঠিক নয়");
    const officer = await saveOfficer({ name, designation, department, phone, email, active }, id);
    return NextResponse.json(officer);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    await requireAdmin(req);
    const { id } = await params;
    await removeOfficer(id);
    return NextResponse.json({ ok: true });
  });
}
