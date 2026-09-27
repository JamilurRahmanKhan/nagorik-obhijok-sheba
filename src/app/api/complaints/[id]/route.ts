import { NextResponse, type NextRequest } from "next/server";
import { ApiError, withApiErrors } from "@/lib/server/errors";
import { requireAdmin } from "@/lib/session";
import { applyComplaintUpdate } from "@/lib/server/complaints";
import { ALL_STATUSES, PRIORITIES } from "@/lib/constants";
import type { Priority, Status } from "@/lib/types";

function asStatus(v: unknown): Status | undefined {
  return typeof v === "string" && (ALL_STATUSES as string[]).includes(v) ? (v as Status) : undefined;
}
function asPriority(v: unknown): Priority | undefined {
  return typeof v === "string" && (PRIORITIES as string[]).includes(v) ? (v as Priority) : undefined;
}

/** Combined "apply" action for the admin detail page: officer, priority, status and/or a note in one request. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    const session = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "অবৈধ অনুরোধ");

    const complaint = await applyComplaintUpdate(
      id,
      {
        officerId: typeof body.officerId === "string" && body.officerId ? body.officerId : undefined,
        priority: asPriority(body.priority),
        status: asStatus(body.status),
        note: typeof body.note === "string" ? body.note : undefined,
      },
      session.name,
    );
    return NextResponse.json(complaint);
  });
}
