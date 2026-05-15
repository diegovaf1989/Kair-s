import { createTRPCRouter } from "@/server/trpc/trpc";
import { userRouter } from "@/server/trpc/routers/user";
import { mentorRouter } from "@/server/trpc/routers/mentor";
import { alunoRouter } from "@/server/trpc/routers/aluno";

export const appRouter = createTRPCRouter({
  user: userRouter,
  mentor: mentorRouter,
  aluno: alunoRouter,
});

export type AppRouter = typeof appRouter;
