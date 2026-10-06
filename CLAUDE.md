# CLAUDE.md

Prototype of the N5Deal marketplace (take-home assignment). Time-boxed: the whole project must be delivered within 24 hours of the start.

## Sources of truth

Working documents live in `.agent/` (git-ignored, local only):

- `.agent/SPEC.md` - implementation spec: scope (MUST / SHOULD / COULD), access rules, data model, screens, design tokens, phase plan with time budgets. Read it fully before any work.
- `.agent/ASSIGNMENT.md` - the company's original assignment. If the spec contradicts it, the assignment wins: stop and report the contradiction.
- `.agent/TASKS.md` - the spec split into numbered tasks per phase with "done when" criteria. Work is done task by task.
- `.agent/screenshots/` - visual reference of n5deal.com.
- `.agent/PROGRESS.md` - start time, task checklist, decisions made during the work, added dependencies, deviations. Keep it updated.
- `.agent/INFRA.md` - Supabase / Vercel setup (done by the developer).

Do not invent requirements, fields, screens or libraries that are not in the spec. If something is not covered, ask.

## Workflow

- The developer drives the work with skills: `/task <id>` implements one task from TASKS.md and stops, `/phase-check <N>` verifies and closes a phase, `/status` compares progress with the time plan.
- Subagents: `phase-verifier` (checks + criteria), `access-reviewer` (spec section 5), `ui-reviewer` (spec sections 8 and 11). All read-only.
- Path-scoped rules in `.claude/rules/` (access, data, ui) load automatically for matching files.
- Work strictly phase by phase (spec section 10). Do not start the next task or phase until the current one is accepted.
- Before reporting a phase as done, run `npm run typecheck`, `npm run lint`, `npm run build` and fix all errors.
- Never run `git commit` or `git push`. At the end of a phase, output: a short summary of what was done, what to check manually, and a proposed commit message (Conventional Commits).
- If a phase is going to exceed its time budget by more than 30%, stop and propose what to simplify.
- Do not add dependencies beyond spec section 2 without a stated reason; record the reason in `.agent/PROGRESS.md`.

## Code rules

- Next.js App Router, TypeScript strict. Server Components for reads, Server Actions for writes.
- Feature-based structure from spec section 3. Pages stay thin: queries in `queries.ts`, mutations in `actions.ts`, access rules in `features/access`.
- Every Server Action checks session, role, user status and ownership on the server. Hiding a button is not access control.
- Validation with zod schemas shared between form and server.
- Prisma 6 (not 7). `DATABASE_URL` - Supabase transaction pooler, `DIRECT_URL` - session pooler. Never the direct `db.*.supabase.co` host.
- Filters, search, sort and page live in the URL.
- Every list is paginated; page sizes come from `lib/pagination.ts`.
- UI text in English, sentence case. Never show raw enum values.
- No layout shift: skeletons match final sizes; on filter changes keep the old list with reduced opacity instead of skeletons.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
