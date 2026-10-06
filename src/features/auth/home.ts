import type { Role } from "@prisma/client";

/** Landing page after login and the target of `/` for each role. */
export function homePath(role: Role): string {
  if (role === "BUYER") return "/assets";
  if (role === "SELLER") return "/buyers";
  return "/admin/users";
}
