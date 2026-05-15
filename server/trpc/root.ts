import { createTRPCRouter } from "@/server/trpc/trpc";
import { userRouter } from "@/server/trpc/routers/user";
import { mentorRouter } from "@/server/trpc/routers/mentor";
import { alunoRouter } from "@/server/trpc/routers/aluno";
import { onboardingRouter } from "@/server/trpc/routers/onboarding";
import { planoRouter } from "@/server/trpc/routers/plano";
import { execucaoRouter } from "@/server/trpc/routers/execucao";
import { mensagemRouter } from "@/server/trpc/routers/mensagem";

export const appRouter = createTRPCRouter({
  user: userRouter,
  mentor: mentorRouter,
  aluno: alunoRouter,
  onboarding: onboardingRouter,
  plano: planoRouter,
  execucao: execucaoRouter,
  mensagem: mensagemRouter,
});

export type AppRouter = typeof appRouter;
