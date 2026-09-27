import { NextResponse, type NextRequest } from "next/server";
import { withApiErrors } from "@/lib/server/errors";
import { requireAdmin } from "@/lib/session";
import { resetDemoData } from "@/lib/server/settings";

export async function POST(req: NextRequest) {
  return withApiErrors(async () => {
    await requireAdmin(req);
    await resetDemoData();
    return NextResponse.json({ ok: true });
  });
}
