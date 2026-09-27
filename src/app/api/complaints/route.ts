import { NextResponse, type NextRequest } from "next/server";
import { ApiError, withApiErrors } from "@/lib/server/errors";
import { requireAdmin, sessionFromRequest } from "@/lib/session";
import { createComplaint, listComplaints } from "@/lib/server/complaints";
import { ACCEPTED_UPLOADS, MAX_ATTACHMENTS, MAX_UPLOAD_BYTES } from "@/lib/constants";
import type { Attachment, Citizen } from "@/lib/types";

export async function GET(req: NextRequest) {
  return withApiErrors(async () => {
    await requireAdmin(req);
    return NextResponse.json(await listComplaints());
  });
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function parseCitizen(v: unknown): Citizen {
  const o = (v ?? {}) as Record<string, unknown>;
  return { name: str(o.name), phone: str(o.phone), email: str(o.email) || undefined, address: str(o.address) };
}

function parseAttachments(v: unknown): Attachment[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, MAX_ATTACHMENTS).flatMap((a): Attachment[] => {
    if (!a || typeof a !== "object") return [];
    const o = a as Record<string, unknown>;
    const name = str(o.name);
    const type = str(o.type);
    const size = typeof o.size === "number" ? o.size : 0;
    const dataUrl = typeof o.dataUrl === "string" ? o.dataUrl : undefined;
    if (!name || (type && !ACCEPTED_UPLOADS.includes(type)) || size > MAX_UPLOAD_BYTES) return [];
    return [{ name, type, size, dataUrl }];
  });
}

/**
 * Creates a complaint. `source`/`by` are never trusted from the request body — they are
 * derived from whether the caller has a valid admin session, so an anonymous citizen can
 * never impersonate an admin-created entry.
 */
export async function POST(req: NextRequest) {
  return withApiErrors(async () => {
    const session = await sessionFromRequest(req);
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "অবৈধ অনুরোধ");

    const subject = str(body.subject).trim();
    const category = str(body.category);
    const department = str(body.department);
    const description = str(body.description).trim();
    const citizen = parseCitizen(body.citizen);

    if (subject.length < 5) throw new ApiError(400, "বিষয় অন্তত ৫ অক্ষরে লিখুন");
    if (!category) throw new ApiError(400, "অভিযোগের ধরন নির্বাচন করুন");
    if (!department) throw new ApiError(400, "দপ্তর নির্বাচন করুন");
    if (description.length < 20) throw new ApiError(400, "বিবরণ অন্তত ২০ অক্ষরে লিখুন");
    if (citizen.name.trim().length < 2) throw new ApiError(400, "পূর্ণ নাম লিখুন");
    if (!/^01[3-9]\d{8}$/.test(citizen.phone)) throw new ApiError(400, "সঠিক মোবাইল নম্বর দিন");
    if (citizen.address.trim().length < 5) throw new ApiError(400, "ঠিকানা লিখুন");

    const priority = body.priority === "high" || body.priority === "medium" || body.priority === "low" ? body.priority : undefined;

    const complaint = await createComplaint({
      subject,
      category,
      department,
      description,
      citizen,
      attachments: parseAttachments(body.attachments),
      priority: session ? priority : undefined,
      source: session ? "admin" : "online",
      by: session ? session.name : "নাগরিক",
    });
    return NextResponse.json(complaint, { status: 201 });
  });
}
