import { z } from "zod";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/** Expected, user-facing failure. The message is shown in a toast or next to a field. */
export class ActionError extends Error {
  constructor(
    message: string,
    /** Set when the failure belongs to a form field (shown under it instead of a toast). */
    readonly fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ActionError) {
      return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
    }
    if (e instanceof z.ZodError) {
      return {
        ok: false,
        error: "Check the highlighted fields",
        fieldErrors: z.flattenError(e).fieldErrors,
      };
    }
    throw e; // NEXT_REDIRECT, NEXT_NOT_FOUND and real bugs must not be swallowed
  }
}
