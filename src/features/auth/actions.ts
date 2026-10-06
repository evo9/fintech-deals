"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ActionError, runAction, type ActionResult } from "@/lib/action";
import { safeNextPath } from "./guards";
import { homePath } from "./home";
import { formDataToLogin, loginSchema } from "./schema";
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

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
