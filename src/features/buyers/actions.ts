"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { runAction, type ActionResult } from "@/lib/action";
import { requireUser } from "@/features/auth/guards";
import { buyerProfileSchema, formDataToProfile } from "./schema";

/** Own profile only: the buyer comes from the session, never from the form. */
export async function saveProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser({ roles: ["BUYER"] });
    const { companyName, ...profile } = buyerProfileSchema.parse(formDataToProfile(formData));

    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { companyName } }),
      db.buyerProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...profile },
        update: profile,
      }),
    ]);

    // the profile feeds the sellers' catalog, matching badges and the buyer's own pages
    revalidatePath("/profile");
    revalidatePath("/buyers");
    revalidatePath("/assets");
  });
}
