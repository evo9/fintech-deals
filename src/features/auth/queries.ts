import type { Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { DEMO_ACCOUNT_EMAILS } from "./demo";

// Only the seeded demo accounts are listed on the login page. Real registrations must not
// appear there: that would publish their emails.
export type DemoAccount = {
  email: string;
  name: string;
  companyName: string | null;
  role: Role;
  status: UserStatus;
};

/** Demo accounts for the login panel. REMOVED users are not listed. */
export async function listDemoAccounts(): Promise<DemoAccount[]> {
  return db.user.findMany({
    where: {
      status: { not: "REMOVED" },
      email: { in: [...DEMO_ACCOUNT_EMAILS] },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { email: true, name: true, companyName: true, role: true, status: true },
  });
}
