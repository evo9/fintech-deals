"use server";

import bcrypt from "bcryptjs";
import { Prisma, type Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ActionError, runAction, type ActionResult } from "@/lib/action";
import { safeNextPath } from "./guards";
import { homePath, onboardingPath } from "./home";
import { formDataToLogin, formDataToRegister, loginSchema, registerSchema } from "./schema";
import { createSession, destroySession } from "./session";

// Compared against when the email is unknown, so both failures take the same time.
const DUMMY_HASH = "$2b$10$QYtTMZlazOcapsDd0Q.rTu10Pnne.MQVLnKIFVTejfqFQym3dQyWq";

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const input = loginSchema.parse(formDataToLogin(formData));

    const user = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: { id: true, passwordHash: true, role: true, status: true },
    });
    const passwordOk = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

    // One message for an unknown email and a wrong password: do not reveal which emails exist.
    if (!user || !passwordOk) throw new ActionError("Incorrect email or password");
    // Only after the password is right, so this message does not disclose registered emails either.
    if (user.status === "REMOVED") {
      throw new ActionError("This account has been removed from the platform.");
    }

    await createSession(user.id);

    const next = safeNextPath(String(formData.get("next") ?? ""));
    redirect(next ?? homePath(user.role));
  });
}

const EMAIL_TAKEN = "An account with this email already exists";

export async function register(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const input = registerSchema.parse(formDataToRegister(formData));
    const email = input.email.toLowerCase();

    const taken = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) throw new ActionError(EMAIL_TAKEN, { email: [EMAIL_TAKEN] });

    const passwordHash = await bcrypt.hash(input.password, 10);
    let user: { id: string; role: Role };
    try {
      user = await db.user.create({
        data: {
          email,
          passwordHash,
          name: input.name,
          companyName: input.companyName,
          country: input.country,
          role: input.role, // BUYER or SELLER only: the schema has no MANAGER
          // a buyer always has a profile row; it stays empty until they fill in interests
          buyerProfile: input.role === "BUYER" ? { create: {} } : undefined,
        },
        select: { id: true, role: true },
      });
    } catch (e) {
      // two requests with the same email at once: the unique index decides
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ActionError(EMAIL_TAKEN, { email: [EMAIL_TAKEN] });
      }
      throw e;
    }

    await createSession(user.id);
    redirect(onboardingPath(user.role));
  });
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
