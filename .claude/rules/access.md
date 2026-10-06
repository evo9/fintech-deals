---
paths:
  - "src/features/**/actions.ts"
  - "src/features/**/queries.ts"
  - "src/features/access/**"
  - "src/features/auth/**"
  - "src/app/**/page.tsx"
  - "src/app/**/layout.tsx"
---

# Access rules (spec section 5)

- All visibility and permission logic lives in `src/features/access/visibility.ts`. Queries and actions import helpers from there; no ad-hoc `status: 'PUBLISHED'` checks scattered in pages.
- Every Server Action starts with `requireUser({ roles })`. Mutations reject SUSPENDED users with "Your account is suspended". Pages that only read pass `allowSuspended: true`.
- Never trust ids or roles from the client: `sellerId`, `senderId`, `managerId` always come from the session.
- Ownership is checked on the server for every asset mutation.
- A resource the user may not see returns `notFound()` (404), never 403 and never a different error text.
- Contact rules: buyer <-> seller only, never self, never with SUSPENDED/REMOVED users, manager does not message. Find-or-create conversation inside a transaction with `findFirst` (NULL `assetId` is not covered by the unique index).
- `/assets` catalog is buyer-only (404 for others); managers use `/admin/assets`. `/assets/[id]` is open to all roles by section 5: buyer - published assets of ACTIVE sellers, seller - own assets in any status (others' only if published), manager - all.
- Managers cannot suspend/remove managers, including themselves. Enforced on the server.
- Login error is always "Incorrect email or password". `?next=` accepts only relative paths starting with a single `/`.
- Email is stored and compared in lower case.
- Validate every action input with the shared zod schema on the server, even if the form already validated it.
