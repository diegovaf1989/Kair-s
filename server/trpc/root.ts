import { createTRPCRouter } from "@/server/trpc/trpc";
import { userRouter } from "@/server/trpc/routers/user";
import { mentorRouter } from "@/server/trpc/routers/mentor";
import { alunoRouter } from "@/server/trpc/routers/aluno";
import { onboardingRouter } from "@/server/trpc/routers/onboarding";
import { planoRouter } from "@/server/trpc/routers/plano";
import { execucaoRouter } from "@/server/trpc/routers/execucao";

export const appRouter = createTRPCRouter({
  user: userRouter,
  mentor: mentorRouter,
  aluno: alunoRouter,
  onboarding: onboardingRouter,
  plano: planoRouter,
  execucao: execucaoRouter,
});

export type AppRouter = typeof appRouter;
