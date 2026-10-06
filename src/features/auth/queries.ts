import type { Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";

// Only seeded demo accounts are listed on the login page. Real registrations must not
// appear there: that would publish their emails.
const DEMO_EMAIL_SUFFIXES = ["@demo.io", "@n5deal.demo"];

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
      OR: DEMO_EMAIL_SUFFIXES.map((suffix) => ({ email: { endsWith: suffix } })),
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { email: true, name: true, companyName: true, role: true, status: true },
  });
}
