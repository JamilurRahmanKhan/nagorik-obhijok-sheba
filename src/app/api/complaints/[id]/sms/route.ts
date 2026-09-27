import { NextResponse, type NextRequest } from "next/server";
import { ApiError, withApiErrors } from "@/lib/server/errors";
import { requireAdmin } from "@/lib/session";
import { sendSms } from "@/lib/server/complaints";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    const session = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text : "";
    if (!text) throw new ApiError(400, "বার্তা লিখুন");
    const complaint = await sendSms(id, text, session.name);
    return NextResponse.json(complaint);
  });
}
