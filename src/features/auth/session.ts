import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 7;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  companyName: string | null;
  country: string | null;
  role: Role;
  status: UserStatus;
  statusReason: string | null;
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

/** Returns the user id, or null for a missing, tampered or expired token. */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

/** Call from a Server Action or Route Handler only: cookies cannot be written while rendering. */
export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

/** Call from a Server Action or Route Handler only. */
export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The user is loaded from the database on every request (deduplicated per request),
 * so a status change made by a manager applies without logging in again.
 * Returns users of any status: REMOVED / SUSPENDED handling lives in the guards.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const userId = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      country: true,
      role: true,
      status: true,
      statusReason: true,
    },
  });
});
