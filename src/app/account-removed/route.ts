import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/features/auth/session";

/**
 * Landing point for REMOVED users hit by a guard. The cookie is deleted only if the
 * user really is REMOVED, so this URL cannot be used to log somebody else out.
 */
export async function GET(request: Request) {
  const user = await getSession();
  if (!user || user.status !== "REMOVED") return NextResponse.redirect(new URL("/", request.url));
  await destroySession();
  return NextResponse.redirect(new URL("/login?reason=removed", request.url));
}
