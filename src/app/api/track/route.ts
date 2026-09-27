import { NextResponse, type NextRequest } from "next/server";
import { withApiErrors } from "@/lib/server/errors";
import { findForTracking } from "@/lib/server/complaints";

/** Public endpoint: returns a complaint only when the tracking id AND phone number both match. */
export async function GET(req: NextRequest) {
  return withApiErrors(async () => {
    const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
    const phone = req.nextUrl.searchParams.get("phone")?.trim() ?? "";
    if (!id || !phone) return NextResponse.json({ error: "আইডি ও মোবাইল নম্বর দিন" }, { status: 400 });
    const complaint = await findForTracking(id, phone);
    if (!complaint) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(complaint);
  });
}
