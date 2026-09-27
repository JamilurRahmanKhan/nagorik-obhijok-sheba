import "server-only";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Wraps a route handler body: ApiError -> {error} with its status, anything else -> 500. */
export async function withApiErrors(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "সার্ভারে একটি সমস্যা হয়েছে, পরে আবার চেষ্টা করুন" }, { status: 500 });
  }
}
