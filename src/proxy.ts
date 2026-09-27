import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Renamed from `middleware.ts` in this Next.js version (see AGENTS.md) — same behavior,
// runs on the Node.js runtime by default here, which is what lets it share the same
// jose-based session verification as the API routes.
export const config = {
  matcher: ["/admin/:path*"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
