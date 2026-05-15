# Kairós Aprovação

Mentoria fechada em ciclos de 90 dias para concurseiros de carreiras policiais e tribunais.

## Stack

Next.js 14+ (App Router), TypeScript strict, Tailwind, shadcn/ui, tRPC, Prisma, Supabase (Postgres), Clerk, Stripe, Inngest, Resend, Anthropic API, Sentry, PostHog, deploy na Vercel.

## Como rodar

```bash
pnpm install
cp .env.example .env.local
# preencha as variáveis
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Em outro terminal:

```bash
pnpm inngest-dev
```

## Fase atual

Fase 0 — Setup & Foundations. Veja `blueprint.md` para detalhes do roadmap.
