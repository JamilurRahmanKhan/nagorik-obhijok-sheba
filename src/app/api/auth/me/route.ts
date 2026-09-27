import { NextResponse, type NextRequest } from "next/server";
import { sessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 });
  return NextResponse.json(session);
}
