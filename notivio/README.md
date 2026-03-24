# Notivio

Notivio is a Next.js study workspace with Stack Auth + PostgreSQL (Prisma) persistence for notebooks, pages, tags, sources, and session state.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy envs:
```bash
cp .env.example .env.local
```

3. Fill these required variables in `.env.local`:
- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`
- `DATABASE_URL`

4. Generate Prisma client and run migrations:
```bash
npm run prisma:generate
npx prisma migrate dev --name init
```

5. Start dev server:
```bash
npm run dev
```

## Auth Routes

- Login: `/auth/login`
- Register: `/auth/register`
- Stack handler callbacks/pages: `/handler/*`

## Notes

- Workspace data is user-scoped and persisted in PostgreSQL.
- Sources (URL + PDF) are persisted server-side and reloaded per workspace/page.
- Active page selection is restored from server state.
