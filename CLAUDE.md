# Kairós Aprovação — Guia para Claude Code

## Stack
Next.js 14+ (App Router), TypeScript strict, Tailwind, shadcn/ui, tRPC, Prisma, Supabase (Postgres), Clerk, Stripe, Inngest, Resend, Anthropic API, Sentry, PostHog, deploy na Vercel. Gerenciador: pnpm.

## Estrutura
- `app/` rotas (App Router), separadas por grupos `(marketing)`, `(auth)`, `(app)`, `(mentor)`.
- `features/` lógica por domínio: cada feature tem `components/`, `server/`, `lib/`.
- `server/trpc/` routers tRPC e contexto.
- `lib/` integrações compartilhadas (ai, inngest, stripe, utils).
- `prisma/` schema e seed.
- `components/ui/` componentes shadcn.

## Regras de código (inegociáveis)
- TypeScript strict, sem `any`. Use `unknown` + narrowing ou tipos discriminados.
- Server Components por default. `"use client"` só quando há estado/efeito/event handler.
- Toda boundary externa (form, API, webhook) valida com Zod antes de tocar o domínio.
- Lógica de negócio fica em `features/*/server/` ou `lib/`. Componentes não fazem regra.
- Acesso a banco só via Prisma e dentro de tRPC procedures ou Server Actions. Nunca direto em componentes.
- Erros tratados explicitamente. Nunca engolir `catch`. Logar no Sentry quando relevante.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.

## Convenções de nome
- Arquivos: `kebab-case.ts` (`user-router.ts`).
- Componentes: `PascalCase` (`PlanoSemanaCard.tsx`).
- Hooks: `useCamelCase`.
- Variáveis de ambiente: validadas em `env.ts` com Zod (T3 env pattern).

## Como rodar
```bash
pnpm install
cp .env.example .env.local
# preencha as variáveis
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

## Quando criar uma feature nova
1. Crie a pasta em `features/<nome>/`.
2. Adicione models no `schema.prisma` se necessário, e rode `pnpm prisma migrate dev --name <nome>`.
3. Crie o router em `server/trpc/routers/<nome>.ts` e registre em `root.ts`.
4. Componentes da feature em `features/<nome>/components/`.
5. Rotas da feature em `app/(app)/<nome>/page.tsx` ou similar.

## O que NÃO fazer
- Não criar componentes "page" gigantes; quebre em componentes menores.
- Não fazer fetch direto no client; use tRPC.
- Não usar `useEffect` para data fetching; React Query/tRPC já cuida.
- Não criar tipos duplicados; reuse Zod schemas via `z.infer<typeof X>`.
- Não commitar `.env.local` nem chaves.

## Fase atual
Fase 1 — Auth, Perfis e Estrutura de Turma.
