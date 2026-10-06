import type { Role } from "@prisma/client";

/** Where a freshly registered user starts: buyers fill in interests, sellers create a first asset. */
export function onboardingPath(role: Role): string {
  return role === "SELLER" ? "/my-assets/new" : "/profile";
}

/** Landing page after login and the target of `/` for each role. */
export function homePath(role: Role): string {
  if (role === "BUYER") return "/assets";
  if (role === "SELLER") return "/buyers";
  return "/admin/users";
}
