---
name: server-action
description: Pattern for writing a Server Action in this project - guard, zod parse, access check, mutation, revalidate, typed result, client call with pending state and toast. Use whenever creating or changing any file named actions.ts or a client component that calls an action.
---

# Server Action pattern

Order inside every action: guard -> parse input -> load target -> access check (helpers from `features/access/visibility.ts`) -> mutation -> revalidate -> result. Expected failures return `{ ok: false }`; `redirect()` / `notFound()` and unexpected errors propagate.

## Shared helper - `src/lib/action.ts`

```ts
import { z } from 'zod';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/** Expected, user-facing failure. Message is shown in a toast or next to a field. */
export class ActionError extends Error {}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) {
      return { ok: false, error: 'Check the highlighted fields', fieldErrors: z.flattenError(e).fieldErrors };
    }
    throw e; // NEXT_REDIRECT, NEXT_NOT_FOUND and real bugs must not be swallowed
  }
}
```

`requireUser()` (in `features/auth/guards.ts`) throws `ActionError('Your account is suspended')` for SUSPENDED users unless `allowSuspended: true`, redirects when there is no session or the user is REMOVED, calls `notFound()` on a wrong role.

## Action - `src/features/assets/actions.ts`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { ActionError, runAction, type ActionResult } from '@/lib/action';
import { requireUser } from '@/features/auth/guards';
import { canManageOwnAsset } from '@/features/access/visibility';
import { assetIdSchema } from './schema';

export async function withdrawAsset(rawId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser({ roles: ['SELLER'] }); // suspended -> ActionError
    const id = assetIdSchema.parse(rawId);

    const asset = await db.asset.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true },
    });
    // Same text for "missing" and "not yours": do not reveal existence.
    if (!asset || !canManageOwnAsset(user, asset)) throw new ActionError('Asset not found');
    if (asset.status !== 'PUBLISHED') throw new ActionError('Only published assets can be withdrawn');

    await db.asset.update({ where: { id }, data: { status: 'ARCHIVED' } });

    revalidatePath('/my-assets');
    revalidatePath(`/assets/${id}`);
  });
}
```

Rules:
- Input type is `unknown` or `FormData`; trust nothing until zod parsed it.
- Author/owner ids come from `user`, never from input.
- Multi-step writes (find-or-create conversation, moderation + log) go into `db.$transaction(async (tx) => ...)`.
- Revalidate every path that shows the changed data.

## Client call - button with pending state and toast

```tsx
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { withdrawAsset } from '@/features/assets/actions';

export function WithdrawButton({ assetId }: { assetId: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await withdrawAsset(assetId);
          if (res.ok) toast.success('Asset withdrawn');
          else toast.error(res.error);
        })
      }
    >
      Withdraw
    </Button>
  );
}
```

## Forms - `useActionState` + zod, no react-hook-form (decision 06.10.2026)

- One zod schema in `features/<feature>/schema.ts`, used by the client on submit (`schema.safeParse`) and by the action (`schema.parse`).
- Field errors shown under fields; the error area has reserved height.

```tsx
// action signature for forms
export async function saveProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser({ roles: ['BUYER'] });
    const input = profileSchema.parse(formDataToProfile(formData));
    await db.buyerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...input }, update: input });
    revalidatePath('/profile');
  });
}
```

```tsx
'use client';

const [state, formAction, pending] = useActionState(saveProfile, null);
const [clientErrors, setClientErrors] = useState<Record<string, string[] | undefined> | null>(null);
const errors = clientErrors ?? state?.fieldErrors;

useEffect(() => {
  if (state?.ok) toast.success('Profile saved');
  else if (state && !state.ok && !state.fieldErrors) toast.error(state.error);
}, [state]);

<form
  action={formAction}
  onSubmit={(e) => {
    const res = profileSchema.safeParse(formDataToProfile(new FormData(e.currentTarget)));
    if (!res.success) {
      e.preventDefault(); // stay on the client, show errors without a round trip
      setClientErrors(z.flattenError(res.error).fieldErrors);
    } else setClientErrors(null); // fall back to server errors
  }}
>
  ...
  <Button type="submit" disabled={pending}>Save profile</Button>
</form>
```

- Multi-value fields (tags, multiselects) are sent as hidden inputs with the same name; `formDataToX` reads them with `formData.getAll()`.
- Inputs keep their values after a failed submit (controlled state or `defaultValue` from the last submitted data).
