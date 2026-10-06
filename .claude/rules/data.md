---
paths:
  - "prisma/**"
  - "src/lib/db.ts"
  - "src/features/**/queries.ts"
---

# Data rules

- Prisma 6 only (`prisma` and `@prisma/client` pinned to 6.x). No `prisma.config.ts`, no driver adapters.
- The database is shared by local dev and production. Schema changes only through `npx prisma migrate dev --name <name>`. Never `db push`. If `migrate dev` reports drift or asks to reset the database, answer no / stop immediately and report to the developer - never reset. Vercel applies only `migrate deploy`. For SQL Prisma cannot express (e.g. `ALTER SEQUENCE "Asset_id_seq" RESTART WITH 700`), use `--create-only`, edit the migration, then apply.
- `DATABASE_URL` = Supabase transaction pooler (6543, `?pgbouncer=true`), `DIRECT_URL` = session pooler (5432). Never the direct `db.*.supabase.co` host.
- `src/lib/db.ts` exports a singleton PrismaClient (global cache in dev).
- Queries select only the fields the screen needs (`select`), list queries return `{ items, total }` and use `skip/take` from `lib/pagination.ts`.
- Count + page query run in one `db.$transaction([...])`.
- Model, field and enum names follow spec section 4 exactly. Do not add fields that the spec does not mention without asking.
- Seed (`prisma/seed.ts`) is idempotent: delete in FK order, then create. Demo password `demo1234` for every account. Run via `"prisma": { "seed": "tsx prisma/seed.ts" }` in package.json (`tsx` is an approved dev dependency).
- `db:seed` / `db:reset` only on the developer's explicit request; never after submission.
