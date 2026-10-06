import { notFound, redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { ActionError } from "@/lib/action";
import { getSession, type SessionUser } from "./session";

/** Only relative paths with a single leading slash; anything else falls back to null. */
export function safeNextPath(next: string | null | undefined): string | null {
  // Browsers strip tabs and newlines inside URLs ("/\t/evil.com" becomes "//evil.com"), so reject every
  // control character and backslash, then check that the value still resolves to the same origin.
  if (!next || /[\u0000-\u001F\u007F\\]/.test(next)) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  try {
    const url = new URL(next, "https://internal.invalid");
    if (url.origin !== "https://internal.invalid") return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

type RequireUserOptions = {
  roles?: Role[];
  /** Pages that only read pass true. Server Actions leave it unset: suspended users cannot change anything. */
  allowSuspended?: boolean;
  /** Path to return to after login (pages know their own URL, a Server Component does not). */
  next?: string;
};

/**
 * No session -> /login?next=. REMOVED -> /account-removed (a route handler: cookies cannot be
 * deleted while rendering). Wrong role -> 404. SUSPENDED without allowSuspended -> ActionError.
 */
export async function requireUser(options: RequireUserOptions = {}): Promise<SessionUser> {
  const user = await getSession();

  if (!user) {
    const next = safeNextPath(options.next);
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  if (user.status === "REMOVED") redirect("/account-removed");
  if (options.roles && !options.roles.includes(user.role)) notFound();
  if (user.status === "SUSPENDED" && !options.allowSuspended) {
    throw new ActionError("Your account is suspended");
  }
  return user;
}
