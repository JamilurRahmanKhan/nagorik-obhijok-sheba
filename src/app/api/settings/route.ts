import { NextResponse, type NextRequest } from "next/server";
import { withApiErrors } from "@/lib/server/errors";
import { requireAdmin } from "@/lib/session";
import { getSettings, updateSettings } from "@/lib/server/settings";

/** Public (needed by the citizen submit form for category/department options and org name). */
export async function GET() {
  return withApiErrors(async () => NextResponse.json(await getSettings()));
}

export async function PATCH(req: NextRequest) {
  return withApiErrors(async () => {
    await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const settings = await updateSettings(body ?? {});
    return NextResponse.json(settings);
  });
}
